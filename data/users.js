const mongoCollections = require("../config/mongoCollections");
const fs = require('fs');
const streamifier = require('streamifier');
const cloudinary = require("cloudinary").v2;
const { ObjectID } = require("mongodb");

const users = mongoCollections.users;

function initCloud() {
  cloudinary.config({
    cloud_name: "stevens-esports",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
function checkString(str, name) {
  if (!str) throw `${name || "provided variable"} is empty`;
  if (typeof str !== "string")
    throw `${name || "provided variable"} is not a string`;
  let s = str.trim();
  if (s === "") throw `${name || "provided variable"} is an empty string`;
}

let uploadImage = (avatar) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream({
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      crop: "limit",
      folder: "avatars/"
    },
    function(e,r) {
      if(r)
        resolve(r);
      else
        reject(e);
    });
    streamifier.createReadStream(avatar).pipe(stream);
  });
};

// Upon deleting user, if user is not using default avatar,
// will delete image from cloud to save space
function deleteImage(avatar){

}

async function checkUserObj(userObj){
    checkString(userObj.firstName, "firstName");
    checkString(userObj.lastName, "lastName");
    checkString(userObj.username, "userName");
    checkString(userObj.nickname, "nickName");
    checkString(userObj.email, "email");
    if(!(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(userObj.email))){
      throw `Email not valid format.`
    }
    checkString(userObj.discordtag, "discordtag");
    if (!/^.{3,32}#[0-9]{4}$/.test(discordtag)){
      throw `Discord tag not in correct format.`;
    }
    checkString(userObj.passwordDigest, "passwordDigest");
    checkString(userObj.role, "roleName");
    checkString(userObj.biography, "biography");
    if (!userObj.avatar) throw `no input for avatar`;
}
module.exports = {
  async getUser(username) {
    const collection = await users();
    if (typeof username !== "string")
      throw `Username/email must be a string! Received ${typeof username}`;
    if (!username || !(username = username.trim()))
      throw `Username/email cannot be empty.`;

    // The username may be an email or username. Search for both.
    username = username.toLowerCase();

    const user = await collection.findOne({
      $or: [
        {
          email: username,
        },
        {
          username: username,
        },
      ],
    });

    if (!user) throw `User with username ${username} not found.`;
    return user;
  },
  async getUserById(id) {
    const collection = await users();
    if (typeof id !== "string")
      throw `ID must be a string! Received ${typeof id}`;
    if (!id || !(id = id.trim())) throw `ID cannot be empty.`;

    let parsedId = ObjectID(id);

    const user = await collection.findOne({
      _id: parsedId,
    });

    if (!user) throw `Error: player ${id} not found.`;

    user._id = user._id.toString();

    return user;
  },
  async getRandomUser() {
    const collection = await mongoCollections.users();
    // The username may be an email or username. Search for both.
    const users = await collection
      .aggregate([
        {
          $sample: { size: 1 },
        },
      ])
      .toArray();
    return users[0];
  },
  async addUser(
    // Error handling
    firstName,
    lastName,
    username,
    email,
    discordtag,
    passwordDigest,
    nickname,
    bio,
    role = "regular"
  ) {
    const collection = await mongoCollections.users();
    checkString(firstName, "firstName");
    checkString(lastName, "lastName");
    checkString(username, "userName");
    checkString(nickname, "nickName");
    checkString(email, "email");
    if(!(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email))){
      throw `Email not valid format.`
    }
    checkString(discordtag, "discordtag")
    if (!/^.{3,32}#[0-9]{4}$/.test(discordtag)){
      throw `Discord tag not in correct format.`;
    }
    checkString(passwordDigest, "passwordDigest");
    // checkString(userObj.role, "roleName");
    checkString(bio, "biography");
    username = username.toLowerCase();    

    const returnVal = await collection.insertOne({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      discordtag: discordtag,
      passwordDigest: passwordDigest,
      nickname: nickname,
      role: role,
      biography: bio,
      avatar: "https://res.cloudinary.com/stevens-esports/image/upload/v1620940207/avatars/default-player.png",
    });

    if (returnVal.insertedCount === 0) throw "Error: Could not add user!";
    return await this.getUserById(returnVal.insertedId.toString());
  },
  async getAllUsers(sanitize = false) {
    const collection = await mongoCollections.users();
    // The username may be an email or username. Search for both.
    const users = await collection.find({}).toArray();
    return sanitize
      ? users.map((user) => {
          delete user.passwordDigest;
          return user;
        })
      : users;
  },
  async setRole(id, role) {
    const collection = await mongoCollections.users();
    if (typeof id !== "string")
      throw `ID must be a string. Received ${typeof id}`;
    if (!id || !(id = id.trim())) throw `ID cannot be empty.`;
    if (!ObjectID.isValid(id)) throw `ID is not a valid BSON ID.`;

    if (typeof role !== "string")
      throw `Role must be a string. Receieved ${typeof role}`;
    if (!role || !(role = role.trim())) throw `Role cannot be empty.`;

    const objId = ObjectID(id);
    const { modifiedCount } = await collection.updateOne(
      { _id: objId },
      { $set: { role: role } }
    );
    if (modifiedCount === 0) throw `Could not update a user with id ${id}`;
    return true;
  },
  async updateUser(id,userObj){
    checkString(id, "id");
    let parsedId = ObjectID(id);
    await checkUserObj(userObj);
    let avatarUrl = "";
    
    const user = await this.getUserById(id);
    username = userObj.username.toLowerCase();

    if(typeof userObj.avatar !== "string"){
      initCloud();
      let resultUpload = await uploadImage(userObj.avatar);
      avatarUrl = resultUpload.secure_url;
    }
    else{
      avatarUrl = userObj.avatar;
    }

  
    const userCollection = await users();
    let updatedUser = {
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      username: username,
      nickname: userObj.nickname,
      email: userObj.email,
      discordtag: userObj.discordtag,
      passwordDigest: userObj.passwordDigest,
      //can't change role through update user method
      role: user.role,
      biography: userObj.biography,
      avatar: avatarUrl
    };
    const updatedInfo = await userCollection.updateOne(
      { _id: parsedId },
      { $set: updatedUser }
    );
    if (updatedInfo.modifiedCount === 0) {
      throw "Could not update user successfully";
    }
    return user;
  },
  
  /**
   * Deletes users (also deletes associated avatar if not default)
   * Retroactively deletes player objects as well
   */
  async deleteUser(id){
    // TODO: Finish deleting users from database, hook up deletePlayer() from players.js
    // TODO: to retroactively delete any player associated with the user
    checkString(id, "id");
    let user = await this.getUserById(id);
    let avatar = user.avatarUrl;

    deleteImage(avatar);

    const userCollection = await users();
    const result = await userCollection.deleteOne({
      _id: user._id,
    });
    if(result.deletedCount !== 1)
      throw "Could not delete user successfully";
    return user;
  }
};
