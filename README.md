# homebridge-mihome4u
A fast up to date homebridge plugin to interface properly with [MiHome](https://mihome4u.co.uk) using the API.
## Config
```json
{
  "platform": "MiHome",
  "username": "youremail@address.co.uk",
  "password": "yourpassword or APIKey",
  "baseURL": "",
  "regex": {
    "enabled": true,
    "match_string": "/(?:\d{3}-\d{2} )?([\w - '’]+)/"
  }
}
```
- `platform`: this should be left default to MiHome
- `username`: your email address
- `password`: either supply your password or API_Key
- `baseURL`: incase the API gets updated
- `regex`: enabled/disabled and then the string to change the display name

###### Scripts
Below are scripts just so that I don't forget them.
- `npm run build` - Build's the TS to JS
- `npm publish` - Publish to NPM
- `npm link` - Allows homebridge to find it
- `npm run watch` - Automatic development and restarting :-)

## Branches
- `master`: This is an automatic deploying branch, anything on here gets uploaded to npm and then out to Homebridge.
- `develop`: This is where all **PR** should be made against. Any others will be closed.
