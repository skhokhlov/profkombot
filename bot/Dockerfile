FROM node:8-alpine
ADD . /api
WORKDIR /api
RUN npm install --only=production
CMD [ "npm", "start" ]