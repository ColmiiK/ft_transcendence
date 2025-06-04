/**
 * @module Debug module for quick generation of test data
 */

const debugUsers = [
  "albagar4",
  "2albagar4",
  "alvegag",
  "2alvegag",
  "escastel",
  "2escastel",
  "ncruzg",
  "2ncruzg",
];

export function isDebugUser(data) {
  const username = data.username;
  if (!username) return false;
  if (debugUsers.includes(username)) return true;
  return false;
}

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
        language: `en`,
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

import { patchUser, getUser } from "../models/userModel.js";
import { addUserFriendPending, acceptUserFriend } from "../models/userModel.js";
import { createChat } from "../models/chatModel.js";
import { createMessage } from "../models/messageModel.js";
import { createMatch, createMatchOffline } from "../models/matchModel.js";

import {
  createTournament,
  addInvitationToTournament,
  modifyInvitationToTournament,
  addParticipantToTournament,
  determineFirstBracket,
  determineSecondBracket,
  getTournamentByID,
  determineFinalStandings,
  finishTournament,
  setTournamentAsStarted,
} from "../models/tournamentModel.js";
import { finishMatch, getMatch } from "../models/matchModel.js";

async function createTestTournament(user, name, game_type, users) {
  let foo = user;
  console.log("Creating tournament...");
  let tournament = await createTournament(
    {
      name: name,
      game_type: game_type,
      users: users,
    },
    foo.id,
  );
  const t_id = tournament.tournament_id;
  for (let i = 0; i < 4; i++) {
    let user = await getUser(users[i]);
    if (!user) {
      await addParticipantToTournament({
        tournament_id: tournament.tournament_id,
        user_id: foo.id,
        alias: users[i],
      });
    } else {
      await addParticipantToTournament({
        tournament_id: tournament.tournament_id,
        user_id: user.id,
        alias: user.username,
      });
    }
  }
  tournament = await getTournamentByID(t_id);
  await determineFirstBracket(tournament);
  tournament = await getTournamentByID(t_id);
  console.log("Finishing first matches...");
  tournament = await getTournamentByID(t_id);
  let match = await getMatch(tournament.tournament_matches[0].match_id);
  await finishMatch(match, 10, 5);
  match = await getMatch(tournament.tournament_matches[1].match_id);
  await finishMatch(match, 10, 3);
  console.log("Determining second bracket...");
  tournament = await getTournamentByID(t_id);
  await determineSecondBracket(tournament);
  tournament = await getTournamentByID(t_id);
  console.log("Finishing second matches...");
  match = await getMatch(tournament.tournament_matches[2].match_id);
  await finishMatch(match, 10, 5);
  match = await getMatch(tournament.tournament_matches[3].match_id);
  await finishMatch(match, 10, 3);
  tournament = await getTournamentByID(t_id);
  console.log("Finishing tournament...");
  const standings = await determineFinalStandings(tournament);
  await finishTournament(tournament, standings);
  console.log("All done!");
}

export async function createDebug() {
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
    await addUserFriendPending(foo.id, bar.id);
    await acceptUserFriend(foo.id, bar.id);
    console.log(`Adding friendship ${foo.username} - ${baz.username}...`);
    await addUserFriendPending(foo.id, baz.id);
    await acceptUserFriend(foo.id, baz.id);
    console.log(`Adding friendship ${bar.username} - ${baz.username}...`);
    await addUserFriendPending(bar.id, baz.id);
    await acceptUserFriend(bar.id, baz.id);
    console.log(`Adding friendship ${qux.username} - ${foo.username}...`);
    await addUserFriendPending(qux.id, foo.id);
    await acceptUserFriend(qux.id, foo.id);
    await addUserFriendPending(foo.id, foo2.id);

    console.log(
      `Creating chat between ${foo.username} and ${foo2.username}...`,
    );
    let foo_foo2_chat = await createChat({
      first_user_id: foo.id,
      second_user_id: foo2.id,
    });
    console.log(
      `Creating chat between ${bar.username} and ${bar2.username}...`,
    );
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
    console.log(
      `Creating chat between ${baz.username} and ${baz2.username}...`,
    );
    let baz_baz2_chat = await createChat({
      first_user_id: baz.id,
      second_user_id: baz2.id,
    });
    console.log(
      `Creating chat between ${qux.username} and ${qux2.username}...`,
    );
    let qux_qux2_chat = await createChat({
      first_user_id: qux.id,
      second_user_id: qux2.id,
    });

    console.log(`Creating messages...`);
    for (let i = 1; i < 50; i++) {
      await createMessage({
        sender_id: foo.id,
        receiver_id: foo2.id,
        chat_id: foo_foo2_chat.id,
        body: `Test message from ${foo.username} to ${foo2.username} number ${i}`,
      });
      await createMessage({
        sender_id: foo2.id,
        receiver_id: foo.id,
        chat_id: foo_foo2_chat.id,
        body: `Test message from ${foo2.username} to ${foo.username} number ${i}`,
      });
      await createMessage({
        sender_id: bar.id,
        receiver_id: bar2.id,
        chat_id: bar_bar2_chat.id,
        body: `Test message from ${bar.username} to ${bar2.username} number ${i}`,
      });
      await createMessage({
        sender_id: bar.id,
        receiver_id: foo.id,
        chat_id: bar_foo_chat.id,
        body: `Test message from ${bar.username} to ${foo.username} number ${i}`,
      });
      await createMessage({
        sender_id: bar.id,
        receiver_id: baz.id,
        chat_id: bar_baz_chat.id,
        body: `Test message from ${bar.username} to ${baz.username} number ${i}`,
      });
      await createMessage({
        sender_id: bar2.id,
        receiver_id: bar.id,
        chat_id: bar_bar2_chat.id,
        body: `Test message from ${bar2.username} to ${bar.username} number ${i}`,
      });
      await createMessage({
        sender_id: baz.id,
        receiver_id: baz2.id,
        chat_id: baz_baz2_chat.id,
        body: `Test message from ${baz.username} to ${baz2.username} number ${i}`,
      });
      await createMessage({
        sender_id: baz2.id,
        receiver_id: baz.id,
        chat_id: baz_baz2_chat.id,
        body: `Test message from ${baz2.username} to ${baz.username} number ${i}`,
      });
      await createMessage({
        sender_id: qux.id,
        receiver_id: qux2.id,
        chat_id: qux_qux2_chat.id,
        body: `Test message from ${qux.username} to ${qux2.username} number ${i}`,
      });
      await createMessage({
        sender_id: qux2.id,
        receiver_id: qux.id,
        chat_id: qux_qux2_chat.id,
        body: `Test message from ${qux2.username} to ${qux.username} number ${i}`,
      });
    }
    await createTestTournament(foo, "Test Tournament 1", "classic-pong", [
      foo.username,
      bar.username,
      baz.username,
      qux.username,
    ]);
    await createTestTournament(foo, "Test Tournament 2", "classic-pong", [
      foo.username,
      "Invited_user_1",
      "Invited_user_2",
      "Invited_user_3",
    ]);
    // await createTestTournament("Test Tournament 2", bar, foo, qux, baz);
    // await createTestTournament("Test Tournament 3", qux, bar, foo, baz);

    console.log("Creating offline matches...");
    for (let i = 0; i < 5; i++) {
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: foo.id,
        first_player_score: 10,
        second_player_score: 5,
        winner_id: foo.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: foo.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: foo.id,
        first_player_score: 3,
        second_player_score: 10,
        winner_id: null,
        loser_id: foo.id,
        rival_alias: "Invited_user",
        host: foo.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: bar.id,
        first_player_score: 10,
        second_player_score: 5,
        winner_id: bar.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: bar.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: bar.id,
        first_player_score: 3,
        second_player_score: 10,
        winner_id: null,
        loser_id: bar.id,
        rival_alias: "Invited_user",
        host: bar.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: baz.id,
        first_player_score: 10,
        second_player_score: 5,
        winner_id: baz.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: baz.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: baz.id,
        first_player_score: 3,
        second_player_score: 10,
        winner_id: null,
        loser_id: baz.id,
        rival_alias: "Invited_user",
        host: baz.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: qux.id,
        first_player_score: 10,
        second_player_score: 5,
        winner_id: qux.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: qux.username,
      });
      createMatchOffline({
        game_type: "pong",
        custom_mode: "classic",
        userId: qux.id,
        first_player_score: 3,
        second_player_score: 10,
        winner_id: null,
        loser_id: qux.id,
        rival_alias: "Invited_user",
        host: qux.username,
      });
      //
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: foo.id,
        first_player_score: 1,
        second_player_score: 0,
        winner_id: foo.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: foo.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: foo.id,
        first_player_score: 0,
        second_player_score: 1,
        winner_id: null,
        loser_id: foo.id,
        rival_alias: "Invited_user",
        host: foo.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: bar.id,
        first_player_score: 1,
        second_player_score: 0,
        winner_id: bar.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: bar.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: bar.id,
        first_player_score: 0,
        second_player_score: 1,
        winner_id: null,
        loser_id: bar.id,
        rival_alias: "Invited_user",
        host: bar.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: baz.id,
        first_player_score: 1,
        second_player_score: 0,
        winner_id: baz.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: baz.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: baz.id,
        first_player_score: 0,
        second_player_score: 1,
        winner_id: null,
        loser_id: baz.id,
        rival_alias: "Invited_user",
        host: baz.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: qux.id,
        first_player_score: 1,
        second_player_score: 0,
        winner_id: qux.id,
        loser_id: null,
        rival_alias: "Invited_user",
        host: qux.username,
      });
      createMatchOffline({
        game_type: "connect_four",
        custom_mode: "classic",
        userId: qux.id,
        first_player_score: 0,
        second_player_score: 1,
        winner_id: null,
        loser_id: qux.id,
        rival_alias: "Invited_user",
        host: qux.username,
      });
    }
    console.log("Creating online matches...");
    for (let i = 0; i < 5; i++) {
      let match;
      match = await createMatch({
        game_type: "pong",
        custom_mode: "custom",
        first_player_id: foo.id,
        first_player_alias: foo.username,
        second_player_id: bar.id,
        second_player_alias: bar.alias,
        host: foo.username,
      });
      await finishMatch(match, 10, 5);
      match = await createMatch({
        game_type: "pong",
        custom_mode: "custom",
        first_player_id: foo.id,
        first_player_alias: foo.username,
        second_player_id: bar.id,
        second_player_alias: bar.alias,
        host: foo.username,
      });
      await finishMatch(match, 6, 10);
      match = await createMatch({
        game_type: "pong",
        custom_mode: "custom",
        first_player_id: baz.id,
        first_player_alias: baz.username,
        second_player_id: qux.id,
        second_player_alias: qux.alias,
        host: baz.username,
      });
      await finishMatch(match, 10, 5);
      match = await createMatch({
        game_type: "pong",
        custom_mode: "custom",
        first_player_id: baz.id,
        first_player_alias: baz.username,
        second_player_id: qux.id,
        second_player_alias: qux.alias,
        host: baz.username,
      });
      await finishMatch(match, 6, 10);
    }
    for (let i = 0; i < 5; i++) {
      let match;
      match = await createMatch({
        game_type: "connect_four",
        custom_mode: "custom",
        first_player_id: foo.id,
        first_player_alias: foo.username,
        second_player_id: bar.id,
        second_player_alias: bar.alias,
        host: foo.username,
      });
      await finishMatch(match, 1, 0);
      match = await createMatch({
        game_type: "connect_four",
        custom_mode: "custom",
        first_player_id: foo.id,
        first_player_alias: foo.username,
        second_player_id: bar.id,
        second_player_alias: bar.alias,
        host: foo.username,
      });
      await finishMatch(match, 0, 1);
      match = await createMatch({
        game_type: "connect_four",
        custom_mode: "custom",
        first_player_id: baz.id,
        first_player_alias: baz.username,
        second_player_id: qux.id,
        second_player_alias: qux.alias,
        host: baz.username,
      });
      await finishMatch(match, 0, 1);
      match = await createMatch({
        game_type: "connect_four",
        custom_mode: "custom",
        first_player_id: baz.id,
        first_player_alias: baz.username,
        second_player_id: qux.id,
        second_player_alias: qux.alias,
        host: baz.username,
      });
      await finishMatch(match, 1, 0);
    }
  }, 4000);
}
