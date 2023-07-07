# Frolf League Processing

## Authors

- Peter Irvine - [@peirvine](https://www.github.com/peirvine)
- Lane Scherber - [@lanescherber](https://github.com/lanescherber)


## Contributing

Contributions are always welcome!

See [contributing.md](https://github.com/peirvine/frolf-league/blob/main/CONTRIBUTING.md) for ways to get started.

Please do not push code that you have not tested locally ([@Gregory-Ledray](https://github.com/Gregory-Ledray) I'm looking at you.)

## Installation

Install Amplify and Yarn with npm

```bash
  npm install -g @aws-amplify/cli
  npm install -g yarn
```
    
## Run Locally

Clone the project

```bash
  // DO NOT FORK
  git clone git@github.com:peirvine/frolf-league.git
```

Go to the project directory

```bash
  cd frolf-league
```

Install dependencies

Before you run `amplify pull` you should reach out to the codeowners to get added to the Amplify instance on AWS.

```bash
  yarn install
  amplify pull --appId `secrete! reach out to @peirvine` --envName staging
```

Start the server

```bash
  yarn start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file. Please reach out the codeowners for a copy of the .env file.

```bash
REACT_APP_AUTH_DOMAIN
REACT_APP_AUTH_CLIENT
REACT_APP_SHEET_ID
REACT_APP_SHEET_RANKINGS_RANGE
REACT_APP_SHEET_SCORECARD_RANGE
REACT_APP_SHEET_HISTORICAL_RANGE
REACT_APP_OAUTH_CLIENT
REACT_APP_OAUTH_SECRET
REACT_APP_OAUTH_REDIRECT


REACT_APP_GOOGLE_SERVICE_ACCOUNT
REACT_APP_GOOGLE_PRIVATE_KEY
```

## Changing Amplify Environments

To change the Amplify Environment and make updates to the schema, follow this diagram. However, you should not checkout other environemnts without consulting the codeowners.
![image](https://user-images.githubusercontent.com/6324633/212432791-3db9eec7-e7fc-41ed-a6a0-7dc15cb1f2cc.png)
