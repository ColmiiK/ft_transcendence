<div align="center">
    <img src="https://raw.githubusercontent.com/15Galan/42_project-readmes/master/banners/cursus/projects/ft_transcendence-light.png#gh-light-mode-only" alt="Banner (claro)" />
    <img src="https://raw.githubusercontent.com/15Galan/42_project-readmes/master/banners/cursus/projects/ft_transcendence-dark.png#gh-dark-mode-only" alt="Banner (claro)" />
    <br>
This project involves undertaking tasks you have never done before.
Remember the beginning of your journey in computer science.
Look at you now; it’s time to shine!
    <br>
 <table>
 <tr><th>Albagar4 (Frontend)</th>
  <td><a href='https://profile.intra.42.fr/users/albagar4' target="_blank">
        <img alt='42 (oscuro)' src='https://img.shields.io/badge/Málaga-black?style=flat&logo=42&logoColor=white'/></td>
 </tr>
 <tr><th>Escastel (Games)</th>
  <td><a href='https://profile.intra.42.fr/users/escastel' target="_blank">
        <img alt='42 (oscuro)' src='https://img.shields.io/badge/Málaga-black?style=flat&logo=42&logoColor=white'/></td>
 </tr>
 <tr><th>Ncruz-ga (Websockets)</th>
  <td><a href='https://profile.intra.42.fr/users/ncruz-ga' target="_blank">
        <img alt='42 (oscuro)' src='https://img.shields.io/badge/Málaga-black?style=flat&logo=42&logoColor=white'/></td>
 </tr>
 <tr><th>Alvega-g (Backend)</th>
  <td><a href='https://profile.intra.42.fr/users/alvega-g' target="_blank">
        <img alt='42 (oscuro)' src='https://img.shields.io/badge/Málaga-black?style=flat&logo=42&logoColor=white'/><br></td>
 </tr>
 </table>
    <img src="https://img.shields.io/badge/score- 125%20%2F%20100-success?color=%2312bab9&style=flat" />
    </a>
<div>
 <img src="https://i.ibb.co/rf6KXJNm/Screenshot-from-2025-06-13-12-53-37.png"/>
</div>
</div>

---

# Mandatory part

This project is about creating a website for a **Pong** contest!

## Overview

The core of this project revolves around offering a nice,
visually pleasing website where users can play the [1972 video game Pong](https://en.wikipedia.org/wiki/Pong),
either in 1v1 matches or 4 player tournaments.

Moreover, the project includes several semi-optional parts or Modules.
These modules complement the mandatory part of the project: a minimum amount of modules, 7 to be exact, are required
for the project to be considered complete.

In this readme you will find a summary of the modules that we decided to include,
with some insights regarding their development.

As always, this project has a few requirements and limitations that we have to be careful around:

- Using libraries or tools that provide an immediate solution to an entire feature is prohibited.
- Using small libraries or tools that help in the development of subcomponents is allowed.
- We must follow any direct instruction of the third-party libraries or tools we use.
- These requirements are under the discretion of the Evaluator to consider adequate.

## Minimal technical requirement

The project can be developed with or without a backend. In our case, we decided to choose the **Backend Framework** module,
which modifies the default language for the backend, PHP, to Node.js and Fastify.

The frontend should be developed using Typescript as base code. This can be enhanced with the **Frontend Framework** module
to include Tailwind CSS.

The website must be a [single-page application](https://en.wikipedia.org/wiki/Single-page_application),
where the user can navigate with the Back and Forward buttons of their browser.

The website must be compatible with the latest, up to date version of **Mozilla Firefox**.

There should be no unhandled errors or warnings when browsing the website.

Docker must be used to run the website, with some other specific requirements, such as:

- The runtime must be located in a specific folder of our cluster machines.
- There should not be non-root UIDs in the containers if bind-mount volumes are used.

## Game

The main purpose of this website is to play Pong against other users.

- Users must be able to participate in live, local, Pong games.
- A player must be able to start and play in **tournaments**, which consist of multiple
  players taking turns playing against each other.
- A registration system is required, users must be able to uniquely identify themselves for the tournaments.
  This can be enhanced by the **Standard User Management** module.
- There must be a **matchmaking system**, the tournament should organize the matchmaking of participants.
- Players must adhere to the same rules, ensuring competitive integrity in matches.
- The game must adhere to the requirements of the **Frontend Module** and capture the spirit of the original Pong.

## Security concerns

There are several security concerns we must be aware of and address:

- Any password stored must be **hashed**.
- The website must be protected againsg **SQL injections** and **Cross-site Scripting** attacks.
- If there is a backend, it is mandatory to enable HTTPS for all aspects, including WSS instead of WS for socket connection.
- There must be validation mechanisms for any input form, either on the base page, on the server-side, if applicable, or both.
- If creating an API, ensure your routes are protected. The security of the website remains critical.

# Major Modules

As explained before, a minimum of 7 modules is required to achieve a successful grade.
We can ensure a better grade by choosing to do more modules, having them as backup in case
of a unexpected failure.

There are two types of modules, major modules and minor modules, with regards to their complexity and time cost.
First, we will look at the major modules we included in our project.

## Backend Framework

Use a specific framework to build the backend, in this case **Node.js** with **Fastify**.
In our case, we decided to create a RESTful API, with basic CRUD routes to handle our data.
Since the project was originally made in Django, we decided to keep the underlying structure somewhat similar,
which in turn allowed us to quickly create all the endpoints and queries needed.

## Standard User Management

Develop a way of authenticating users across multiple tournaments and play sessions.
Users should be able to securely subscribe to the website, log in, select a unique display name,
update their information, upload an avatar with default options, add other users as friends and view their online status
and finally see their stats, like wins, losses and a match history.
We also created pixel art cats for the users to choose from!

## Remote Authentication

Implement an authentication system through **Google Sign-in**.
This should allow users to securely log in and register, with a focus on the ease of use for the user and superb security.
In hindsight, this proved to be more difficult that it should, as the Google Button interface presents some warnings and issues
that we had to work around, or in some cases, accept as a side product of the module.

## Another game

The goal of this module is to add another complete game, with all of the features of Pong, such as tournaments and other
features added by other modules as well.
In our case, this game was Connect 4, which contrasts the quick pace of Pong with slower, more methodical turn-based strategy.

## Live Chat

With this module, we will provide our users with a chat where they will be able to send direct messages, talk, and invite them to play games.
In addition, users should be able to block other users, preventing them from seeing their messages.
Also, we had to provide a way of navigating to the user's profile if they wanted.
We leveraged [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to establish quick, bidirectional connections between the users.

## Introduce an AI opponent

Incorporate an AI player into the game. The AI opponent provides a challenging experience without the need for other users.
This AI must replicate human behaviour, simulating keyboard input just like a user. Notably, this AI must not use the [A\* Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm).
We must ensure feature parity, so this AI had to work in both Pong and Connect 4.
Also, we are limited in the amount of information the AI can obtain, it can only observe the play field once a second.

## Two-Factor Authentication and JSON Web Tokens

The goal of this module is to enhance security through the use of Two-Factor Authentication (2FA) and JSON Web Tokens (JWT).
2FA provides an additional layer of security for the user through the use of 2FA apps, SMS or email-based verification.
JWT are a secure method for authenticating and authorizing the user, ensuring that user sessions and resources are managed safely.
The inclusion of JWT was an amazing idea, since it simplified the process of authorizing the user in a great way.
It also provided an easy way for the frontend to make requests without having to worry about the information of the user.

# Minor Modules

That concludes the major modules found in our project.
Now, we will look at the minor modules included.

It is important to remember that 2 minor modules are counted as one major module for evaluation purposes

## Frontend Framework

Use a specific framework or toolkit to build the frontend, in this case **Tailwind CSS**.
This allows us to style our webpage in the beautiful way that you can see above.
It also enables us to provide a responsive design for all users.

## Use a database for the backend

We must use a database to safely store information about our webpage and users. To achieve this, we must use **SQLite**.
A database is a great tool to store information about our users and other relevant data that we might need.
In the end, our backend relied heavily in the usage of queries to obtain and manipulate the data.

## Game customization options

The goal of this module is to provide the user with different and exciting gaming challenges.
This could be achieved in a number of different ways, like adding maps or power-ups.
Users should still be able to play classic modes of the games.
The modes we chose were, for Pong:

- Chaos Mode: from time to time, a yellow area appears. When the ball goes through, it applies a random effect to your opponent.
  This can increase or decrease the velocity of the paddle, increase or decrease its size, etc.

And for Connect 4:

- CrazyTokens: each player starts with 3 randomly selected special tokens. Ghost tokens that hide all played tokens,
  a bomb token that explodes nearby ones in a 3x3 pattern, or a token that switches the colors around are just a few examples.

## User and Game Stats Dashboards

In this module, we will provide the user a place to examine and visualize their data.
Using [Chart.js](https://www.chartjs.org/), we provide the user with a couple of charts and graphs where they can see
their wins and losses, and also the last 10 matches in depth.

## GDPR Compliance

We will ensure compliance with the [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation),
maintaining a clear, streamlined process for users to request the deletion of their data,
in addition to having a clear, transparent communication about the users and their rights.
We provide the user with a way of deleting their account if they want. This anonymizes their
personally identifiable information for the rest of the users. If the user then wants to log in again,
they will recover their account.

## Support on all devices

With this module, we focus on making sure that our website works seamlessly on all types of devices.
We must maintain a responsive website in all situations, and also provide the users with touch controls if needed.
The brunt of this module revolved around the responsiveness of the page, adapting the interface to the screen size and controls.

## Expanding Browser Compatibility

Here, we will add support to another browser of our choice, in our case **Google Chrome**.
With the exception of a few points, this was a somewhat easy module without many surprises, since
Firefox tends to be a stricter browser to work with.

## Multiple Language Support

Through the clever use of a key-value pair system, we ensure that our website remains accessible for a diverse group of users.
In our case, this means translating the webpage to Spanish and French, in addition to the native English.
A painstaking process of providing keys to all HTML and TS messages, this was offset by how simple was to add a third, or even
fourth language if we wanted to.

# How to run

If you want to experience the website as it was intended, you can run it by providing a **.env** file in the root of the project.
The provided **.env-example** shows the structure needed. Then, it is as easy as running **make**.
The only requirement for the project is **Docker**, as the dependencies are handled by the containers themselves.

# Closing regards

This project is a massive undertaking: from the amount of work needed to achieve a barely stable website,
to the continuous iteration and advancements required to finalize and complete all the required modules,
this couldn't have been possible without all the teamwork.

Some of the decisions we made with the modules could have been improved, such as the Live Chat, which in hindsight is a truly massive
module just on it's own. Some other modules would have been interesting to work with, like designing the backend as **microservices**.

If you want a list of the available modules, you can find the full subject of this project in [42's Intra](https://projects.intra.42.fr/ft_transcendence/mine).
