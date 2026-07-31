# TeddyWeb React

This is the React frontend for the WebTeddy project.

## Setup

To run the dev server, first make sure you have Node and NPM installed and updated.

First, run `npm install` to install all requirements.

Run `npx vite` to start the development server. The page should be running and available at http://localhost:5173/. You'll need to be running the Django server locally too, so it can serve the required static files.

Note that the React development server passes all relevant requests through to the Django development server, so you should now be able to access the Djando admin console through http://localhost:5173/admin/

## Production Build

To build the production bundle, run this command: `npx vite build`
