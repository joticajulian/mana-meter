// SPDX-License-Identifier: MIT

import { System, authority, Arrays } from "@koinos/sdk-as";
import { System2 } from "@koinosbox/contracts";

export class ManaMeter {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  /**
   * Authority function
   * @external
   */
  authorize(): authority.authorize_result {
    const txId = System.getTransactionField("id")!.bytes_value;
    const block = System.getBlock();
    for (let i = 0; i < block.transactions.length; i += 1) {
      if (Arrays.equal(block.transactions[i].id, txId)) {
        if (System2.isSignedBy(this.contractId)) {
          return new authority.authorize_result(true);
        }
        return new authority.authorize_result(false);
      }
    }
    return new authority.authorize_result(true);
  }
}
