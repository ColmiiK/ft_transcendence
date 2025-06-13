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

# Modules

As explained before, a minimum of 7 modules is required to achieve a successful grade.
We can ensure a better grade by choosing to do more modules, having them as backup in case
of a unexpected failure.

There are two types of modules, major modules and minor modules, with regards to their complexity and time cost.
First, we will look at the major modules we included in our project.

## Backend Framework

Use a specific framework to build the backend, in this case **Node.js** with **Fastify**.

## Standard User Management
