import { loadFixture, ethers, expect } from "./setup";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Multisig", function () {
  async function deploy() {
    const [owner1, owner2, owner3, owner4, notOwner1, notOwner2] =
      await ethers.getSigners();
    const required = 3;

    const Factory = await ethers.getContractFactory("Multisig");
    const multisig = await Factory.deploy(
      [owner1, owner2.address, owner3.address, owner4.address],
      required
    );
    await multisig.waitForDeployment();

    return { owner1, owner2, owner3, owner4, notOwner1, notOwner2, multisig };
  }

  it("should be deployed", async function () {
    const { owner1, owner2, owner3, owner4, multisig } = await loadFixture(
      deploy
    );

    expect(multisig.target).to.be.properAddress;
    expect(await multisig.ownersForConfirmations(0)).to.eq(owner1.address);
    expect(await multisig.ownersForConfirmations(1)).to.eq(owner2.address);
    expect(await multisig.ownersForConfirmations(2)).to.eq(owner3.address);
    expect(await multisig.ownersForConfirmations(3)).to.eq(owner4.address);

    expect(await multisig.required()).to.eq(3);
  });

  it("should submit transaction offered by an owner ", async () => {
    const { owner1, notOwner2, multisig } = await loadFixture(deploy);
    const amount = 2;
    const duration = 100;
    const transaction = await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    const block = await transaction?.getBlock();
    const timestamp = block?.timestamp;

    const tx = await multisig.transactions(0);
    expect(tx[0]).to.eq(notOwner2.address);
    expect(tx[1]).to.eq(amount);
    expect(tx[2]).to.eq(duration);
    expect(tx[3]).to.eq(timestamp);
    expect(tx[4]).to.eq(false);
  });

  it("should fail if the transaction offered by not an owner", async () => {
    const { notOwner1, notOwner2, multisig } = await loadFixture(deploy);
    const amount = 2;
    const duration = 100;
    await expect(
      multisig
        .connect(notOwner1)
        .submitTransaction(notOwner2.address, amount, duration)
    ).to.be.revertedWith("Not An Owner");
  });

  it("should accept the confirmation sent by the owner ", async () => {
    const { owner1, owner2, notOwner2, multisig } = await loadFixture(deploy);

    await multisig.connect(owner1).submitTransaction(notOwner2.address, 1, 100);
    await multisig.connect(owner2).confirmTransaction(0);

    const confirmation = await multisig.confirmations(0, owner2);
    expect(confirmation).to.eq(true);
  });

  it("should fail if the confirmation sent by someone other than the owner ", async () => {
    const { owner1, notOwner1, notOwner2, multisig } = await loadFixture(
      deploy
    );
    const amount = 2;
    const duration = 100;
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    await expect(
      multisig.connect(notOwner1).confirmTransaction(0)
    ).to.be.revertedWith("Not An Owner");
  });

  it("should be executed with the required number of owners confirmed", async () => {
    const { owner1, owner2, owner3, notOwner2, multisig } = await loadFixture(
      deploy
    );
    const amount = 2; //wei
    const duration = 100;

    await owner1.sendTransaction({
      to: multisig.target,
      value: amount,
    });
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    await multisig.connect(owner2).confirmTransaction(0);

    await expect(
      multisig.connect(owner3).confirmTransaction(0)
    ).to.changeEtherBalances(
      [notOwner2.address, multisig.target],
      [amount, -amount]
    );
    await expect((await multisig.transactions(0)).executed).to.eq(true);
  });

  it("should fail if transaction is Expired", async () => {
    const { owner1, owner2, owner3, notOwner2, multisig } = await loadFixture(
      deploy
    );
    const amount = 2; //wei
    const duration = 100;

    await owner1.sendTransaction({
      to: multisig.target,
      value: amount,
    });
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    await multisig.connect(owner2).confirmTransaction(0);
    const timestamp1 = await time.latest();
    console.log(timestamp1);

    const timestamp2 = await time.increase(duration);
    console.log(timestamp2);
    await expect(
      multisig.connect(owner3).confirmTransaction(0)
    ).to.be.revertedWith("Transaction Expired");
  });

  it("should fail if it's repeated execution", async () => {
    const { owner1, owner2, owner3, owner4, notOwner2, multisig } =
      await loadFixture(deploy);
    const amount = 2; //wei
    const duration = 100;

    await owner1.sendTransaction({
      to: multisig.target,
      value: amount,
    });
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    await multisig.connect(owner2).confirmTransaction(0);
    await multisig.connect(owner3).confirmTransaction(0);
    await expect(
      multisig.connect(owner4).confirmTransaction(0)
    ).to.be.revertedWith("Already Executed");
  });

  it("should emit Submited event", async () => {
    const { owner1, notOwner2, multisig } = await loadFixture(deploy);
    const amount = 2; //wei
    const duration = 100;
    const tx = await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    const transaction = await tx.wait();
    const block = await transaction?.getBlock();
    const timestamp = block?.timestamp;
    await expect(tx)
      .to.emit(multisig, "Submited")
      .withArgs(
        0,
        owner1.address,
        notOwner2.address,
        amount,
        duration,
        timestamp
      );
  });

  it("should emit Confirmed event", async () => {
    const { owner1, notOwner2, multisig } = await loadFixture(deploy);
    const amount = 2; //wei
    const duration = 100;
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);

    await expect(multisig.connect(owner1).confirmTransaction(0))
      .to.emit(multisig, "Confirmed")
      .withArgs(0, owner1.address);
  });

  it("should emit Executed event", async () => {
    const { owner1, owner2, owner3, notOwner2, multisig } = await loadFixture(
      deploy
    );
    const amount = 2; //wei
    const duration = 100;

    await owner1.sendTransaction({
      to: multisig.target,
      value: amount,
    });
    await multisig
      .connect(owner1)
      .submitTransaction(notOwner2.address, amount, duration);
    await multisig.connect(owner2).confirmTransaction(0);

    const tx = await multisig.connect(owner3).confirmTransaction(0);
    const transaction = await tx.wait();
    const block = await transaction?.getBlock();
    const timestamp = block?.timestamp;

    await expect(transaction)
      .to.emit(multisig, "Executed")
      .withArgs(0, notOwner2.address, amount, timestamp);
  });
});
