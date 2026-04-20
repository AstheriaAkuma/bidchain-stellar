import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const ESCROW_KEY = process.env.NEXT_PUBLIC_ESCROW_KEY!;

const horizonServer = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

export { CONTRACT_ID, NETWORK_PASSPHRASE };

export async function buildPlaceBidTx(
  bidderAddress: string,
  auctionId: number,
  _bidAmount: number
): Promise<string> {
  const account = await horizonServer.loadAccount(bidderAddress);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.createClaimableBalance({
        asset: StellarSdk.Asset.native(),
        amount: "1", // 1 XLM = demo deposit stand-in
        claimants: [
          // Platform can always claim (winner path)
          new StellarSdk.Claimant(ESCROW_KEY),
          // Bidder can reclaim after 1 day (loser refund path)
          new StellarSdk.Claimant(
            bidderAddress,
            StellarSdk.Claimant.predicateNot(
              StellarSdk.Claimant.predicateBeforeRelativeTime("86400")
            )
          ),
        ],
      })
    )
    .addMemo(StellarSdk.Memo.text(`BidChain:auction:${auctionId}`))
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

export async function submitSignedTx(signedXDR: string) {
  const tx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  );
  const result = await horizonServer.submitTransaction(tx);
  return { hash: result.hash, status: "SUCCESS" };
}

export function stellarExpertUrl(txHash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}