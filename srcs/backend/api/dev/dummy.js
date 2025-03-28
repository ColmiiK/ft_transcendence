/**
 * @module Debug module for quick generation of test data
 */

/**
 * Creates a user with the credentials:
 *       username: name,
 *       email: `${name}@gmail.com`,
 *       password: `${name}.Password1`,
 *       confirm_password: `${name}.Password1`,
 * @param {String} name - Name of user
 */

async function debugRegister(name, email) {
  process.stdout.write(`Creating test user ${name}...`);
  try {
    let res = await fetch("http://localhost:9000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: name,
        email: `${email}@gmail.com`,
        password: `${name}.Password1`,
        confirm_password: `${name}.Password1`,
      }),
    });
    const body = await res.json();
    const cookies = res.headers.get("set-cookie");
    const jwtCookie = cookies.match(/token=([^;]+)/);
    const token = jwtCookie[1];
    console.log(res.status, `(${token})`);
    return body;
  } catch (err) {
    console.error("Error:", err);
  }
}

import { patchUser } from "../models/userModel.js";
import { addUserFriend } from "../models/userModel.js";
import { createChat } from "../models/chatModel.js";
import { createMessage } from "../models/messageModel.js";

setTimeout(async () => {
  let foo = await debugRegister("albagar4", "alba.sansebastian5b");
  let foo2 = await debugRegister("2albagar4", "2alba.sansebastian5b");
  let bar = await debugRegister("alvegag", "alvarvg");
  let bar2 = await debugRegister("2alvegag", "2alvarvg");
  let baz = await debugRegister("ncruzg", "nestorcruzgambero");
  let baz2 = await debugRegister("2ncruzg", "2nestorcruzgambero");
  let qux = await debugRegister("escastel", "estercastellanorios");
  let qux2 = await debugRegister("2escastel", "2estercastellanorios");
  await patchUser(foo.id, { is_2fa_enabled: true });

  console.log(`Adding friendship ${foo.username} - ${bar.username}...`);
  await addUserFriend(foo.id, bar.id);
  console.log(`Adding friendship ${foo.username} - ${baz.username}...`);
  await addUserFriend(foo.id, baz.id);
  console.log(`Adding friendship ${bar.username} - ${baz.username}...`);
  await addUserFriend(bar.id, baz.id);
  console.log(`Adding friendship ${qux.username} - ${foo.username}...`);
  await addUserFriend(qux.id, foo.id);

  console.log(`Creating chat between ${foo.username} and ${foo2.username}...`);
  let foo_foo2_chat = await createChat({
    first_user_id: foo.id,
    second_user_id: foo2.id,
  });
  console.log(`Creating chat between ${bar.username} and ${bar2.username}...`);
  let bar_bar2_chat = await createChat({
    first_user_id: bar.id,
    second_user_id: bar2.id,
  });
  console.log(`Creating chat between ${bar.username} and ${foo.username}...`);
  let bar_foo_chat = await createChat({
    first_user_id: bar.id,
    second_user_id: foo.id,
  });
  console.log(`Creating chat between ${bar.username} and ${baz.username}...`);
  let bar_baz_chat = await createChat({
    first_user_id: bar.id,
    second_user_id: baz.id,
  });
  console.log(`Creating chat between ${baz.username} and ${baz2.username}...`);
  let baz_baz2_chat = await createChat({
    first_user_id: baz.id,
    second_user_id: baz2.id,
  });
  console.log(`Creating chat between ${qux.username} and ${qux2.username}...`);
  let qux_qux2_chat = await createChat({
    first_user_id: qux.id,
    second_user_id: qux2.id,
  });

  console.log(`Creating messages...`);
  for (let i = 1; i < 5; i++) {
    await createMessage({
      sender_id: foo.id,
      receiver_id: foo2.id,
      chat_id: foo_foo2_chat.id,
      body: `Test message from ${foo.username} number ${i}`,
    });
    await createMessage({
      sender_id: foo2.id,
      receiver_id: foo.id,
      chat_id: foo_foo2_chat.id,
      body: `Test message from ${foo2.username} number ${i}`,
    });
    await createMessage({
      sender_id: bar.id,
      receiver_id: bar2.id,
      chat_id: bar_bar2_chat.id,
      body: `Test message from ${bar.username} number ${i}`,
    });
    await createMessage({
      sender_id: bar.id,
      receiver_id: foo.id,
      chat_id: bar_foo_chat.id,
      body: `Test message from ${bar.username} number ${i}`,
    });
    await createMessage({
      sender_id: bar.id,
      receiver_id: baz.id,
      chat_id: bar_baz_chat.id,
      body: `Test message from ${bar.username} number ${i}`,
    });
    await createMessage({
      sender_id: bar2.id,
      receiver_id: bar.id,
      chat_id: bar_bar2_chat.id,
      body: `Test message from ${bar2.username} number ${i}`,
    });
    await createMessage({
      sender_id: baz.id,
      receiver_id: baz2.id,
      chat_id: baz_baz2_chat.id,
      body: `Test message from ${baz.username} number ${i}`,
    });
    await createMessage({
      sender_id: baz2.id,
      receiver_id: baz.id,
      chat_id: baz_baz2_chat.id,
      body: `Test message from ${baz2.username} number ${i}`,
    });
    await createMessage({
      sender_id: qux.id,
      receiver_id: qux2.id,
      chat_id: qux_qux2_chat.id,
      body: `Test message from ${qux.username} number ${i}`,
    });
    await createMessage({
      sender_id: qux2.id,
      receiver_id: qux.id,
      chat_id: qux_qux2_chat.id,
      body: `Test message from ${qux2.username} number ${i}`,
    });
  }
}, 2000);
