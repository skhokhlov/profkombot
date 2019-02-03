# Profkombot

### 1. Introduction
Bot build on a microservices architecture by Docker. There are several independent components: DB, API, bots, etc. This allows creating the new components for the system. 

### 2. Database
Data stores in the key-value database ([Redis](https://pypi.org/project/redis/)). Data include only phone numbers and property types for each user. For example, for user +14737895423 which persist in RZD and SUBSIDIES indexes we will store a set with a key `14737895423` and values `{RZD, SUBSIDIES}`.

### 3. API
Data accessible by the RESTful API written on python. There are an URL scheme: http://api/api/<version\>/<index\>/[phone_number]. API DOESN’T CHECK security permissions for the clients. It means that EACH client connected to the API have full access. It’s not a vulnerability because services running in an isolated containers security for which guaranteed by Docker. In case of that remember for check thet all ports are unexposed for production environment.

### 4. Bots
There are two Telegram bots as a UI. Main bot for basic user interaction. And an administration bot for privileged interactions with the API.

### 5. Future Work
Design of the system allows creating new components to work with DB. Seems useful creating web UI for basic and administrative usage. It lets increase the coverage of the audience.

Second case of improvements is updating database to store all of the organization indices for complete migration from external services.
