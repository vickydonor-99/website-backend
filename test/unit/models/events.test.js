const chai = require("chai");
const { expect } = chai;

const cleanDb = require("../../utils/cleanDb");
const firestore = require("../../../utils/firestore");

const eventQuery = require("../../../models/events");
const eventModel = firestore.collection("events");
const peerModel = firestore.collection("peers");

const eventDataArray = require("../../fixtures/events/events")();
const eventData = eventDataArray[0];

describe("Events", function () {
  afterEach(async function () {
    await cleanDb();
  });

  describe("createEvent", function () {
    it("should create a new event in firestore", async function () {
      const result = await eventQuery.createEvent(eventData);

      const data = (await eventModel.doc(eventData.room_id).get()).data();

      expect(result).to.deep.equal(data);
    });
  });

  describe("updateEvent", function () {
    it("should update the enabled property of a event", async function () {
      const docRef = eventModel.doc(eventData.room_id);
      await docRef.set(eventData);

      await eventQuery.updateEvent({ id: "641e3b43a42edf3910cbc8bf", enabled: true }, eventModel);

      const docSnapshot = await eventModel.doc(docRef.id).get();
      const data = docSnapshot.data();

      expect(data.enabled).to.equal(true);
    });
  });

  describe("endActiveEvent", function () {
    it("should update the lock, reason, and status of a event", async function () {
      const docRef = await eventModel.add(eventData);

      try {
        await eventQuery.endActiveEvent({
          id: docRef.id,
          reason: "test reason",
          lock: true,
        });

        const docSnapshot = await eventModel.doc(docRef.id).get();
        const data = docSnapshot.data();

        expect(data.lock).to.equal(true);
        expect(data.reason).to.equal("test reason");
        expect(data.status).to.equal("inactive");
      } catch (error) {
        expect(error).to.exist();
        expect(error.message).to.equal("Error in enabling event.");
      }
    });
  });

  describe("addPeerToEvent", function () {
    it("should create a new peer document if it doesn't exist", async function () {
      const docRef = await eventModel.add(eventData);

      const peerData = {
        peerId: "someid",
        name: "NonExistingPeer",
        eventId: docRef.id,
        role: "participant",
        joinedAt: new Date(),
      };

      const result = await eventQuery.addPeerToEvent(peerData);

      const docSnapshot = await peerModel.doc(result.peerId).get();
      const data = docSnapshot.data();

      expect(data.name).to.equal(peerData.name);
      expect(data.joinedEvents).to.have.lengthOf(1);
      expect(data.joinedEvents[0].event_id).to.equal(peerData.eventId);
      expect(data.joinedEvents[0].role).to.equal(peerData.role);
    });

    it("should update the joinedEvents array if the peer document exists", async function () {
      const docRef = await eventModel.add(eventData);

      const peerData = {
        peerId: "someid",
        name: "ExistingPeer",
        eventId: docRef.id,
        role: "participant",
        joinedAt: new Date(),
      };

      await peerModel.add({
        peerId: peerData.peerId,
        name: peerData.name,
        joinedEvents: [],
      });

      await eventQuery.addPeerToEvent(peerData);

      const docSnapshot = await peerModel.doc(peerData.peerId).get();
      const data = docSnapshot.data();

      expect(data.joinedEvents).to.have.lengthOf(1);
      expect(data.joinedEvents[0].event_id).to.equal(peerData.eventId);
      expect(data.joinedEvents[0].role).to.equal(peerData.role);
    });
  });
});
