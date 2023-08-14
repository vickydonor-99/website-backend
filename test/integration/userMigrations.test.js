const chai = require("chai");
const { expect } = chai;
const chaiHttp = require("chai-http");

const app = require("../../server");
const authService = require("../../services/authService");
const addUser = require("../utils/addUser");
const cleanDb = require("../utils/cleanDb");
// Import fixtures
const userData = require("../fixtures/user/user")();
const superUser = userData[4];
const nonSuperUser = userData[0];
const colorBearingUsernames = [superUser.username, nonSuperUser.username];

const config = require("config");
const cookieName = config.get("userToken.cookieName");

chai.use(chaiHttp);

describe("userColorMigrations", function () {
  let superUserId;
  let superUserAuthToken;
  let userId = "";
  let nonSuperUserId = "";
  beforeEach(async function () {
    userId = await addUser(nonSuperUser);
    superUserId = await addUser(superUser);
    nonSuperUserId = userId;
    superUserAuthToken = authService.generateAuthToken({ userId: superUserId });
  });

  afterEach(async function () {
    await cleanDb();
  });

  describe("PATCH /migrations/user-default-color", function () {
    it("Should return 401 if user is not a super user", function (done) {
      const nonSuperUserJwt = authService.generateAuthToken({ userId: nonSuperUserId });
      chai
        .request(app)
        .patch(`/migrations/user-default-color`)
        .set("cookie", `${cookieName}=${nonSuperUserJwt}`)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res).to.have.status(401);
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("You are not authorized for this action.");
          return done();
        });
    });
    it("Should add default color property to all users,using authorized user (super_user)", function (done) {
      chai
        .request(app)
        .patch(`/migrations/user-default-color`)
        .set("cookie", `${cookieName}=${superUserAuthToken}`)
        .end((err, res) => {
          if (err) {
            return done(err);
          }

          expect(res).to.have.status(200);
          expect(res.body.usersDetails.totalUsersFetched).to.be.equal(colorBearingUsernames.length);
          expect(res.body.usersDetails.totalUsersUpdated).to.be.equal(colorBearingUsernames.length);
          expect(res.body.usersDetails.totalUsersUnaffected).to.be.equal(0);
          return done();
        });
    });
  });
});