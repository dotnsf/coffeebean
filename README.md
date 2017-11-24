# Coffeebean

Google Analytics like web analytic tool.

## Overview

Google Analytics like web analytic tool written in JavaScript.


## Pre-requisite

- You need Cloudant, NoSQL DBaaS, instance. If you don't have one yet, we recommend you to get one from IBM Bluemix(http://bluemix.net/). You need username and password of Cloudant.

- You also need to install node.js and npm in application server.

## Install

- Git clone/download source code from GitHub.

- Edit settings.js with your Cloudant username and password.

- (Optional)Edit settings.js with Basic Authentication username and password if you want to use Basic Authentication.

- (Optional)Edit public/coffeebean.js (L.103) with your application server name.

- Install libraries

    - $ npm install

- Run app.js with Node.js

    - $ node app

## How to use

- load coffeebean.js in your HTML page(see public/index.html and public/index2.html for example).

- Enjoy!

## Licensing

This code is licensed under MIT.

## Copyright

2017 K.Kimura @ Juge.Me all rights reserved.


