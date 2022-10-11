## Introduction

[TODO]

## Configurations

- Create `.env` file in the root of repository such that it contains required env variables. Sample of this file is provided in repo named `.env.example`.

- Update `.env` file with suitable configurations

  ```env
  # CHROMIUM
  PUPPETEER_EXECUTABLE_PATH='/usr/bin/chromium-browser'
  ```

- To create initial super user in migration, provide below configuration in `.env` file.

NOTE: while using docker to run the Backend

- Edit the `docker-compose.yml` file. (if required)

## Setup

- Run the following command to set-up postgres and run migrations:

```sh
  make set-up-postgres
```

- Start dependencies:

```sh
  make start-dependencies
```

- Start Backend container:

```sh
  make start-backend
```

## Deployment

1. Take latest pull

   ```sh
   git pull
   ```

1. Install dependency

   ```sh
   npm install
   ```

1. Update version

   ```sh
   npm run version
   ```

1. Generate build

   ```sh
   npm run build
   ```
