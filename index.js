const util = require('util');
const { exec, spawn } = require('child_process');
const promisifiedExec = util.promisify(exec);
const prompts = require('prompts');

main().catch(error => {
  console.error(error);
  setTimeout(() => {}, 2000);
});

async function main() {
  const config = require('./config.json');
  const devicesPromise = (async () => {
    const command = 'powershell.exe "Get-AudioDevice -List | Select-Object -Property Type, Name, ID | ConvertTo-Json"';
    const { stdout, stderr } = await promisifiedExec(command);
    if (stderr) throw `Error getting audio devices: ${stderr}`;
    const json = JSON.parse(stdout);
    return (Array.isArray(json) ? json : [json]).filter(device => device.Type == 'Playback');
  })();
  
  const channels = [];
  const sets = {};
  const keys = {};
  for (const channel of config.channels) {
    for (const obj in channel) {
      if (typeof channel[obj] !== 'string') continue;
      for (const [variable, replacement] of Object.entries(config.variables)) {
        channel[obj] = channel[obj].replace(`{${variable}}`, replacement);
      }
    }
    
    if (channel.set) {
      if (!sets[channel.set]) sets[channel.set] = [];
      sets[channel.set].push(channel);
    }
    
    if (keys[channel.key]) throw `error: duplicate key ${key}`;
    keys[channel.key] = channel;
    channels.push(channel);
  }

  const handlers = [], CONTINUE_NEXT = 1;
  handlers.push(async (input) => {
    const set = sets[input];
    return set ? set : CONTINUE_NEXT;
  });
  handlers.push(async (input) => {
    const channel = keys[input];
    return channel ? [channel] : CONTINUE_NEXT;
  });
  handlers.push(async (input) => {
    return input.match(/^[\w]+$/) ? 
      [{ target: config.defaultTarget.replace('{{target}}', input) }] :
      CONTINUE_NEXT;
  });
  handlers.push(async (input) => {
    return [{ target: input }];
  });
  
  const input = (await prompts([{
    type: 'text',
    name: 'input',
    message: `
      ${Object.keys(sets).join('/')} -> opens an entire set,
      ${Object.keys(keys).slice(0,3).join('/')}/.. -> open a single channel by key
      If no protocol is specified, assume ${config.defaultTarget}
      Enter the target stream:`.split('\n').map(s => s.trim()).filter(s => !!s).join('\n')
  }])).input;
  
  const devices = await devicesPromise;
  if (devices.length <= 0) throw 'no audio devices';
  for (const channel of channels) {
    channel.deviceName = channel.device;
    channel.device = devices.find(device => device.Name === channel.device);
  }
  
  let toLaunch;
  for (let handler of handlers) {
    toLaunch = await handler(input);
    if (toLaunch !== CONTINUE_NEXT) break;
  }
  
  for (const channel of toLaunch) {
    if (!channel.target) throw 'no target specified';
    if (channel.deviceName && !channel.device) 
      console.error(`expected device ${channel.deviceName} is not present`);
    if (!channel.device) channel.device = (await prompts([{
      type: 'select', name: 'device', message: 'Select an audio output device',
      choices: devices.sort((a, b) => {
        if (a.Name < b.Name) return -1;
        if (a.Name > b.Name) return 1;
        return 0;
      }).map(device => {
        return { title: device.Name, value: device };
      })
    }])).device;
    
    // remove leading section, VLC wants uppercase (?), and escape braces for streamlink
    const guid = channel.device.ID.split('}.')[1].toUpperCase().replace('{', '{{').replace('}', '}}');
    const vlcArgs = [
      '--repeat', '--ignore-config', '--no-qt-privacy-ask', '--no-osd', '--aout=directsound',
      `--directx-audio-device=${guid}`, '--adaptive-lowlatency=1',  '--qt-system-tray',
      '--qt-auto-raise=3', '--qt-minimal-view'
    ];
    if (!channel.autoscale) vlcArgs.push('--no-autoscale');
    
    const title = config.playerTitle
      .replace('{device}', channel.device.Name)
      .replace('{target}', channel.target);
    const streamlinkArgs = [
      `--player-args "${vlcArgs.join(' ')}"`,
      `--title "${title}"`, '--player-continuous-http',
      '--twitch-low-latency', '--hls-segment-stream-data',
      '--hls-live-edge 1',
      channel.target, 'best'
    ];

    const subprocess = spawn('streamlink', streamlinkArgs, {
      shell: true,
      detached: true,
      stdio: ['ignore','ignore','ignore'],
    });
    subprocess.unref();
  }
}