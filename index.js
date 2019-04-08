"use strict";

const fs = require('fs');

const promisify = require('nyks/function/promisify');
const passthru = promisify(require('nyks/child_process/passthru'));
const spawn     = promisify(require('nyks/child_process/exec'));
const tmppath  = require('nyks/fs/tmppath');

class netsh {


  static async connect(ssid, psk) {
    let name = ssid;

    let profile_path = tmppath('xml');
    let body = netsh.createWlanProfile(ssid, psk, name);
    fs.writeFileSync(profile_path, body);

    await passthru("netsh", ["wlan", "add", "profile", "user=all", "filename=" + profile_path]);
    await passthru("netsh", ["wlan", "connect", name]);
  }

  async getWifiList() {
    const regWifi = /SSID .*: (.*)/;
    const data = await spawn("netsh", ["wlan", "show",  "networks"]);
    return String(data).split('\n').map(t => t.trim()).filter(t => regWifi.test(t)).map(t => regWifi.exec(t)[1]);
  }


  static  createWlanProfile(ssid, psk, name) {
    var template = `<?xml version="1.0"?>
    <WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
      <name>${name}</name>
      <SSIDConfig>
        <SSID>
          <hex>${Buffer.from(ssid).toString('hex')}</hex>
          <name>${ssid}</name>
        </SSID>
      </SSIDConfig>
      <connectionType>ESS</connectionType>
      <connectionMode>manual</connectionMode>
      <MSM>
        <security>
          <authEncryption>
            <authentication>WPA2PSK</authentication>
            <encryption>AES</encryption>
            <useOneX>false</useOneX>
          </authEncryption>
          <sharedKey>
            <keyType>passPhrase</keyType>
            <protected>false</protected>
            <keyMaterial>${psk}</keyMaterial>
          </sharedKey>
        </security>
      </MSM>
      <MacRandomization xmlns="http://www.microsoft.com/networking/WLAN/profile/v3">
        <enableRandomization>false</enableRandomization>
        <randomizationSeed>3809986497</randomizationSeed>
      </MacRandomization>
    </WLANProfile>`;
    return template;
  }

}



module.exports = netsh;
