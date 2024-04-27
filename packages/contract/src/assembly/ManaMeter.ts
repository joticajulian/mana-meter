// SPDX-License-Identifier: MIT

import { System, Storage, Base58, Protobuf, authority } from "@koinos/sdk-as";
import { common } from "@koinosbox/contracts";
import { manameter } from "./proto/manameter";

const MY_VALUE_SPACE_ID = 1;
const USER_DATA_SPACE_ID = 2;

export class ManaMeter {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  /**
   * Use the Storage class to define objects to save
   * in the storage of the contract
   */
  myValue: Storage.Obj<common.str> = new Storage.Obj(
    this.contractId,
    MY_VALUE_SPACE_ID,
    common.str.decode,
    common.str.encode,
    () => new common.str("default value"),
  );

  /**
   * For maps use Storage.Map, for instance, to store
   * user balances
   */
  userData: Storage.Map<Uint8Array, manameter.userdata> =
    new Storage.Map(
      this.contractId,
      USER_DATA_SPACE_ID,
      manameter.userdata.decode,
      manameter.userdata.encode,
      () => new manameter.userdata(),
    );

  /**
   * Authority function to share mana
   * @external
   */
  authorize(args: authority.authorize_arguments): authority.authorize_result {
    // share mana with everyone
    if (args.type == authority.authorization_type.transaction_application) {
      const txRcLimit =
        System.getTransactionField("header.rc_limit")!.uint64_value;
      const rcLimit = this.rcLimit.get()!.value;
      if (txRcLimit > rcLimit) {
        System.fail(
          `set max mana to a value inferior to ${this.formatMana(rcLimit)}`
        );
      }
      return new authority.authorize_result(true);
    }

    System.log("authorization must be for transaction_application");
    return new authority.authorize_result(false);
  }
  /**
   * Get my value
   * @external
   * @readonly
   */
  get_my_value(): common.str {
    return this.myValue.get()!;
  }

  /**
   * Get user data
   * @external
   * @readonly
   */
  data_of(args: common.address): manameter.userdata {
    return this.userData.get(args.value!)!;
  }

  /**
   * Set my value
   * @external
   * @event my_value_event common.str
   */
  set_my_value(args: common.str): void {
    this.myValue.put(args);

    System.event(
      "set_my_value",
      Protobuf.encode<common.str>(args, common.str.encode),
      [],
    );
  }

  /**
   * Set user data
   * @external
   * @event data_updated userdata_args
   */
  set_data_of(args: manameter.userdata_args): void {
    // Check if the account authorized this transaction
    const isAuthorized = System.checkAuthority(
      authority.authorization_type.contract_call,
      args.account!,
    );
    System.require(
      isAuthorized,
      `not authorized by ${Base58.encode(args.account!)}`,
    );

    // update data in the storage
    this.userData.put(args.account!, args.data!);

    System.event(
      "set_data_of",
      Protobuf.encode<manameter.userdata_args>(
        args,
        manameter.userdata_args.encode,
      ),
      [args.account!],
    );
  }
}
