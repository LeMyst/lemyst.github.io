---
title: "Generating DayZ Map Tiles"
author: myst
date: 2024-09-06 18:00:00 +0200
last_modified_at: 2024-09-06 18:00:00 +0200
categories: [ dayz ]
tags: [ dayz, map, tiles, imagemagick ]
---

As a DayZ server owner or administrator, you may want to generate map tiles for your server to provide an interactive map for your players. Map tiles allow players to view the terrain, buildings, and other points of interest in the game world, helping them navigate and plan their adventures more effectively.

In this guide, we will walk you through the process of generating map tiles for your DayZ server.

## Prerequisites

Before you begin, make sure you have the following prerequisites:
- Basic knowledge of Windows command line
- DayZ server installed on your machine
- DayZ Tools installed on your machine
- Arma 3 Tools installed on your machine (or you can ask someone to give you the ArmA 3 Tools Texview 2)
- ImageMagick installed on your machine

This post is written for Microsoft Windows users.
It is also written for the ChernarusPlus map, but you can adapt it to other maps by changing the map data files.

## Step 1: Install DayZ Server, Tools and Arma 3 Tools Texview 2

The first step is to install a DayZ server on your machine. You need to own a copy of the game to have access to the necessary server files.
To download the server files, use Steam and find DayZ Server in the Tools section. Download and install the server files on your machine or server.

Next, install DayZ Tools, which is a set of tools provided by Bohemia Interactive to work with DayZ server files. You can download DayZ Tools from the Steam store.
You need to configure your Work Drive in the settings to point to an empty folder where you will extract the server files.
Then, extract the server files to the Work Drive folder using DayZ Tools by using the "Extract Game Data" in the Tools menu.
If you want to do this for another map, you will need to extract the map data files from the game files trough another method.

Install Arma 3 Tools on your machine from the Steam store. You will need the Texview 2 tool from Arma 3 Tools to extract the map data from the game files.
The Texview 2 tool is located in the TexView2 folder of the Arma 3 Tools installation directory.

## Step 2: Extracting the Map Data

Once you have extract the game data, you will find the map data files in the folder DZ/worlds/chernarusplus/data/layers of your Work Drive.

Copy all the files named s_*_*_lco.paa to another folder, you should have 1024 files in total.

Copy the Pal2PacE.exe tool from the TexView2 folder to the folder where you copied the map data files.

Create an output folder in the same directory where you copied the map data files.

Open a command prompt in the directory where you copied the map data files and the Texview 2 tool.

Run the following command to extract the map data:
```bash
Get-ChildItem -Filter 's_*.paa' | ForEach-Object { .\Pal2PacE.exe $_.FullName "output\$($_.BaseName).png" }
```

You should now have 1024 PNG files in the output folder, which represent the map tiles for ChernarusPlus.

## Step 3: Preparing the Map Tiles

Because of the map tiles have extra pixels around them, we need to crop them to remove the borders.
The size to crop can be different for each map, but for ChernarusPlus, we will crop 16 pixels from each side.
On Namalsk map, you need to crop 56 pixels from each side.

We will use ImageMagick to crop the tiles and remove the borders.

Use the mogrify command from ImageMagick to crop the tiles:
```powershell
magick.exe mogrify -shave 16x16 output\s_*_lco.png
```

This can take a while, depending on your machine.

## Step 4: Stitching the Map Tiles

Now we are going to stitch the map tiles together to create a single image of the entire map.
We are doing it two times, once for the vertical tiles and once for the horizontal tiles.

Use the following command to stitch the vertical tiles, using powershell (to help with the file naming):
```powershell
for ($i=0; $i -le 31; $i++) { $f_i = "{0:D3}" -f $i; magick.exe "output\s_${f_i}_*.png" -append "output\vert_${f_i}.png" }
```

Use the following command to stitch the horizontal tiles (notice the +append instead of -append):
```bash
magick.exe "output\vert_*.png" +append "output\map.png"
```

### Conclusion

You can find the final map image in the output folder as `map.png`.
You can now use this image to create an interactive map for your DayZ server using web technologies like Leaflet or OpenLayers.