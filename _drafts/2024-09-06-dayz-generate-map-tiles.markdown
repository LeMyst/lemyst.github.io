---
title: "Generating DayZ Map Tiles"
author: myst
date: 2024-09-06 18:00:00 +0200
last_modified_at: 2025-02-22 12:00:00 +0100
categories: [ dayz ]
tags: [ dayz, map, tiles, imagemagick ]
---

As a DayZ server owner or administrator, you may want to generate map tiles for your server to provide an interactive map for your players. Map tiles allow players to view the terrain, buildings, and other points of interest in the game world,
helping them navigate and plan their adventures more effectively.

In this guide, we will walk you through the process of generating map tiles for your DayZ server.

## Prerequisites

Before you begin, make sure you have the following prerequisites:

- Basic knowledge of Windows command line
- DayZ server installed on your machine, for the map data files
- DayZ Tools installed on your machine, for extracting the map data files
- Arma 3 Tools installed on your machine (or you can ask someone to give you the ArmA 3 Tools Texview 2), for extracting the map data files
- ImageMagick installed on your machine, for cropping and stitching the map tiles

Here's the links to download the tools:

- [DayZ Server](steam://launch/223350)
- [DayZ Tools](steam://launch/830640)
- [Arma 3 Tools](steam://launch/233800)
- [ImageMagick](https://imagemagick.org/script/download.php#windows), I recommend the version `ImageMagick-7.1.1-43-portable-Q16-HDRI-x64.zip`, the version number may change

This post is written for Microsoft Windows users.
It is also written for the ChernarusPlus map, but you can adapt it to other maps by changing the map data files and adapting the cropping size.

## Step 1: Install DayZ Server, Tools and Arma 3 Tools Texview 2

The first step is to install a DayZ server on your machine. You need to own a copy of the game to have access to the necessary server files.  
To download the server files, use Steam and find `DayZ Server` in the `Tools` category. Download and install the server files on your machine or server.

Next, install `DayZ Tools`, which is a set of tools provided by Bohemia Interactive to work with DayZ server files. You can download `DayZ Tools` from the Steam store in the `Tools` category.  
You need to configure your Work Drive in the settings to point to an empty folder where you will extract the server files.  
Then, extract the server files to the Work Drive folder using `DayZ Tools` by using the `Extract Game Data` in the `Tools` menu.  
You need to do that each time the map is updated.  
If you want to do this for another map, you will need to extract the map data files from the game files trough another method.

Install `Arma 3 Tools` on your machine from the Steam store, in the `Tools` category. You will need the `Texview 2` tool from `Arma 3 Tools` to extract the map data from the game files.  
The `Texview 2` tool is located in the TexView2 folder of the Arma 3 Tools installation directory.

## Step 2: Extracting the Map Data

Once you have extract the game data, you will find the map data files in the folder `DZ/worlds/chernarusplus/data/layers` of your Work Drive.

Create a new folder named, for example, `map_data`.  
In this folder, create a subfolder named `source` and one named `output`.  
In the `map_data` folder, copy the `Pal2PacE.exe` tool from the TexView2 folder and the `magick.exe` tool from the ImageMagick installation directory.
Copy all the files named `s_*_*_lco.paa` from the `DZ/worlds/chernarusplus/data/layers` folder to the `source` folder in the `map_data` folder.

At this point, you should have in your `map_data` folder the following files:

- `Pal2PacE.exe`
- `magick.exe`
- `source` folder with the `s_*_*_lco.paa` files
- `output` folder

Open a powershell terminal in the `map_data` folder and run the following command to extract the map data, this can take a while:

```powershell
Get-ChildItem -Filter 'source\s_*.paa' | ForEach-Object { .\Pal2PacE.exe $_.FullName "output\$( $_.BaseName ).png" }
```

You should now have 1024 PNG files in the output folder, which represent the map tiles for ChernarusPlus.

## Step 3: Preparing the Map Tiles

Because of the map tiles have extra pixels around them, we need to crop them to remove the borders.  
The size to crop can be different for each map, but for ChernarusPlus, we will crop 16 pixels from each side.  
On Namalsk map, you need to crop 56 pixels from each side.

We will use ImageMagick to crop the tiles and remove the borders.

Use the mogrify command from ImageMagick to crop the tiles:

```powershell
.\magick.exe mogrify -verbose -shave 16x16 output\s_*_lco.png
```

This can take a while, depending on your machine.

Don't run this command a second time, or you will crop the tiles more than needed.

## Step 4: Stitching the Map Tiles

Now we are going to stitch the map tiles together to create a single image of the entire map.  
We are doing it two times, once for the vertical tiles and once for the horizontal tiles.

Use the following command to stitch the vertical tiles, still using powershell and ImageMagick:

```powershell
for ($i = 0; $i -le 31; $i++) {
    $f_i = "{0:D3}" -f $i; .\magick.exe -verbose "output\s_${f_i}_*.png" -append "output\vert_${f_i}.png"
}
```

It will create 32 vertical tiles in the output folder.

Use the following command to stitch the horizontal tiles (notice the +append instead of -append):

```powershell
.\magick.exe -verbose "output\vert_*.png" +append "map.png"
```

### Conclusion

You can find the final map image in the `map_data` folder named `map.png`.  
You can now use this image to create an interactive map for your DayZ server using web technologies like Leaflet or OpenLayers.
