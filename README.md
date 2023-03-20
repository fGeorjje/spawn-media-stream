# spawn-media-stream

A Windows CLI tool to play media streams using streamlink & VLC, with configuration options for automatic audio device setting & opening sets of channels at once. Heavily inspired by [@GamesDoneQuick/spawn-media-player](https://github.com/GamesDoneQuick/spawn-media-player). Intended for use for speedrun marathons to drastically reduce intermission time. 

## Installation

1. Install [git](https://git-scm.com/downloads),
[nodejs](https://nodejs.org/en/),
[VLC Media Player](https://www.videolan.org/vlc/download-windows.html),
and [streamlink](https://streamlink.github.io/install.html#windows-binaries).
2. Run the following command in an **elevated** PowerShell terminal:
```Install-Module -Name AudioDeviceCmdlets```
3. Run the following commands in a normal terminal/command prompt:
```
git clone https://github.com/fgeorjje/spawn-media-stream
cd spawn-media-stream
npm install
```

## Configuration

`defaultTarget`: If the provided user input doesn't contain a protocol/site (e.g. just "fgeorjje"), assume this target format. *{target}* is replaced by the user input.  
`playerTitle`: The title for VLC. Supports *{device}* and *{target}*.    
`variables`: JSON object of variables (as keys) mapped to values that can be *{referenced}* in the channels list.  
`channels`: Array of channel objects containing the following:
  - `set`: What set to assign this channel. When setting multiple channels to a set, inputting just the set identifier will open all channels on that set.
  - `key`: A short key to open just that channel, e.g. `1a` to open just `twitch.tv/youreventchannels1a`.
  - `target`: The full target of this channel for streamlink. Supports anything that streamlink supports.
  - `autoscale`: If set and truthy, allows the VLC stream to be resized. If not set, adds `--no-autoscale` to the VLC parameters.
  
Autoscale is only recommended to be turned on for views that you are not broadcasting (e.g. commentary streams). For anything else, `--no-autoscale` + OBS game capture will capture the full VLC stream with no rescaling.

Example configuration base:
```
{
  "defaultTarget": "twitch.tv/{target}",
  "playerTitle": "{target} - {device}",
  "variables": {
    "prefix": "twitch.tv/youreventrunnerchannels",
    "line1": "Line 01 (Synchronous Audio Router)",
    "line2": "Line 02 (Synchronous Audio Router)",
    "line3": "Line 03 (Synchronous Audio Router)",
    "line4": "Line 04 (Synchronous Audio Router)"
  },
  "channels": [
    { "set": "1", "key": "1a", "target": "{prefix}1a", "device": "{line1}" },
    { "set": "1", "key": "1b", "target": "{prefix}1b", "device": "{line2}" },
    { "set": "1", "key": "1c", "target": "{prefix}1c", "device": "{line3}" },
    { "set": "1", "key": "1d", "target": "{prefix}1d", "device": "{line4}" }
    
    { "set": "2", "key": "2a", "target": "{prefix}2a", "device": "{line1}" },
    { "set": "2", "key": "2b", "target": "{prefix}2b", "device": "{line2}" },
    { "set": "2", "key": "2c", "target": "{prefix}2c", "device": "{line3}" },
    { "set": "2", "key": "2d", "target": "{prefix}2d", "device": "{line4}" },
    
    { "set": "3", "key": "3a", "target": "{prefix}3a", "device": "{line1}" },
    { "set": "3", "key": "3b", "target": "{prefix}3b", "device": "{line2}" },
    { "set": "3", "key": "3c", "target": "{prefix}3c", "device": "{line3}" },
    { "set": "3", "key": "3d", "target": "{prefix}3d", "device": "{line4}" },
  ]
}
```

## Usage 

Launch using `node .` and follow the on-screen instructions.

Place a shortcut to a batch file launching this program in `<user dir>\AppData\Roaming\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar` for quick access.

## License

[MIT](LICENSE)