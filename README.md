<div align="center">

<img src="frontend/public/brand/logo-lockup-dark.png" alt="LitZap" width="360" />

### Money, everywhere.

**Open money for the world — the consumer money app of Litecoin's LitVM.**

</div>

---

## What is LitZap?

LitZap is **not a wallet — it's a money app.** MetaMask stores your crypto and leaves you on your own. LitZap *runs your money*: sign in with email, claim a `name.zap` handle, and send, request, split, escrow, and drop money — non-custodial, gas-free, with an AI agent (**Zapster**) that does the work.

Litecoin is a 13-year, globally-trusted payments brand with **no modern consumer app**. LitZap fills that seat on **LitVM (LiteForge)**, Litecoin's EVM Layer-2.

## Why it's different

- **No seed phrase.** Email / Google / wallet sign-in → an embedded, non-custodial wallet is created for you.
- **Gas-free.** Payments are gas-sponsored — users never hold or think about a gas token.
- **Pay by identity.** Send to a `name.zap`, an address, or a verified **X / Discord** handle.
- **Programmable money, not just transfers.** Requests, bill-splits, red-packet **Drops**, **escrow** (hold-until-delivered / auto-refund), and recurring payments — on-chain primitives, not features bolted onto a wallet.
- **An AI money agent.** Zapster is built into the app, with a selectable personality.

## Be the layer

The contracts **are** the protocol. Every primitive is a public, composable building block on LiteForge — so **businesses and fellow ecosystem projects can integrate LitZap directly**: pay users by social handle, run payouts, resolve `name.zap` identities, or accept payments. The app is the consumer face; the protocol is the platform.

## Deployed contracts — LitVM / LiteForge (chain `4441`)

| Contract | Purpose | Address |
|---|---|---|
| `LitZapRegistry` | `name.zap` identity | [`0x5F98A240De0a92620Fad513525c4F5f046b4A81D`](https://liteforge.explorer.caldera.xyz/address/0x5F98A240De0a92620Fad513525c4F5f046b4A81D) |
| `LitZapPay` | non-custodial payments + requests + boomerang claims | [`0xE5bF48f6b6Ea117Cac3Fa7B5E466441778E28c9A`](https://liteforge.explorer.caldera.xyz/address/0xE5bF48f6b6Ea117Cac3Fa7B5E466441778E28c9A) |
| `LitZapEscrow` | pay-by-social + hold-until-delivered escrow | [`0x315Fd6effBd3aDbd1CfBc53BE5d6CFB32A23fE30`](https://liteforge.explorer.caldera.xyz/address/0x315Fd6effBd3aDbd1CfBc53BE5d6CFB32A23fE30) |
| `LitZapDrops` | on-chain group money drops (red-packet) | [`0x1cF889Fd8e262b639Acf23B4E33c3cE5134b9d01`](https://liteforge.explorer.caldera.xyz/address/0x1cF889Fd8e262b639Acf23B4E33c3cE5134b9d01) |
| `LitZapSubscriptions` | recurring payments | [`0x9C4E9902173fB14A0CdC5B60F74E4Dbd55D5344B`](https://liteforge.explorer.caldera.xyz/address/0x9C4E9902173fB14A0CdC5B60F74E4Dbd55D5344B) |
| `LitZapCapsule` | on-chain collectibles (ERC-721) | [`0x3F7b5DC6687761A8B49bC57B33183EB5150180b0`](https://liteforge.explorer.caldera.xyz/address/0x3F7b5DC6687761A8B49bC57B33183EB5150180b0) |

USDC (LiteForge): [`0xd5118dEe968d1533B2A57aB66C266010AD8957fa`](https://liteforge.explorer.caldera.xyz/address/0xd5118dEe968d1533B2A57aB66C266010AD8957fa)

## Tech

- **Contracts:** Solidity 0.8.24, OpenZeppelin v5, Hardhat (evm target `cancun`).
- **App:** Next.js 14 (app router), wagmi v2 / viem v2, Privy (auth + embedded wallets), Framer Motion, Tailwind.
- **Brand:** custom mascot **Zapster**, Fraunces + Plus Jakarta Sans.

## Security & trust

LitZap is non-custodial by design: signing in creates an embedded wallet only you control — LitZap never holds your keys and cannot move your funds. Every primitive is a public contract on LitVM you can read and verify; a relayer sponsors gas but can never touch your balance; pay-by-social escrow releases only to the verified owner (bound to their address, front-run-safe) and auto-refunds if unclaimed.

This is an **unaudited testnet** deployment — transactions are public, not private, and balances should be treated as test funds. Full write-up: **[litzap.xyz/security](https://litzap.xyz/security)**. Responsible disclosure: `flamingobuidl@gmail.com`.

## Roadmap

1. **Move** — agentic + programmable payments (split / schedule / escrow / request / drop). ← live & in progress
2. **Grow** — yield on idle balances, savings goals (DeFi invisible under the hood).
3. **Spend** — card, off-ramp, and receive-from-any-chain.

## Local development

```bash
# contracts
cd contracts && npm install && npx hardhat compile

# app
cd frontend && npm install --legacy-peer-deps
cp .env.example .env.local   # fill in values
npm run build && npm start
```

## License

Released under the [MIT License](LICENSE) — the contracts and code are open building blocks. Integrate, fork, and build on them.

---

<div align="center">
Built on <b>LitVM</b> · Litecoin's EVM Layer-2
</div>
