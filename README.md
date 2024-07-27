<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

# hospyta

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.x or later)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) (v1.22 or later)

## Installation

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone hhttps://github.com/harwarl/hospyta.git
```

```bash
cd hospyta
```

### 2. Install Dependencies

Install the project dependencies using Yarn:

```bash
yarn install
```

### 3. Set Up the Database

Make sure you have a MongoDB instance running and accessible. The default configuration assumes MongoDB is running locally on port 27017.

### 4. create an env file

```bash
cd .env
```

### 5. Run the Application

```bash
yarn start:dev
```

# Schema Design

## 1. USER

The User entity represents a user in the system.

\_id: ObjectId - Unique identifier for the user.
firstName: string - User's first name.
lastName: string - User's last name.
username: string - Unique username for the user.
password: string - Hashed password for authentication.
email: string - Unique email address for the user.
createdAt: timestamp - Date and time when the user was created.
updatedAt: timestamp - Date and time when the user was last updated.
bio: string - A short biography about the user.
profilePic: string - URL to the user's profile picture.
posts: [Post] - List of posts authored by the user.
favourites: [Post] - List of posts favorited by the user.
dislikes: [Post] - List of posts disliked by the user. 2. Post

## 2. POST

The Post entity represents a post created by a user.

\_id: ObjectId - Unique identifier for the post.
slug: string - Unique slug for the post.
title: string - Title of the post.
content: string - Content of the post.
categories: [string] - List of categories associated with the post.
likes: number - Number of likes on the post.
dislikes: number - Number of dislikes on the post.
views: number - Number of views of the post.
createdAt: timestamp - Date and time when the post was created.
updatedAt: timestamp - Date and time when the post was last updated.
author: User - The user who authored the post.
authorId: string - The ID of the user who authored the post. 3. Comment

## 3. Comment

The Comment entity represents a comment made on a post.

\_id: ObjectId - Unique identifier for the comment.
postSlug: string - The slug of the post the comment belongs to.
userId: string - ID of the user who made the comment.
text: string - Content of the comment.
replies: [Reply] - List of replies to the comment.
createdAt: timestamp - Date and time when the comment was created.
updatedAt: timestamp - Date and time when the comment was last updated. 4. Reply

## 4. Reply

The Reply entity represents a reply to a comment.

\_id: ObjectId - Unique identifier for the reply.
commentId: string - ID of the comment being replied to.
userId: string - ID of the user who made the reply.
text: string - Content of the reply.
createdAt: timestamp - Date and time when the reply was created.
updatedAt: timestamp - Date and time when the reply was last updated.
