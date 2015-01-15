
Linked Open Data (LOD) has emerged as one of the largest collection of interlinked datasets on the web. Benefiting from this mine of data requires the existence of descriptive information about each dataset in the accompanying metadata. Such meta information is currently very limited to few data portals where they are usually provided manually thus giving little or bad quality insights. To address this issue, we propose a scalable automatic approach for extracting, validating and generating descriptive linked dataset profiles. This approach applies several techniques to check the validity of the attached metadata as well as providing descriptive and statistical information of a certain dataset as well as a whole data portal. Using our framework on prominent data portals shows that the general state of the Linked Open Data needs attention as most of datasets suffer from bad quality metadata and lack additional informative metrics.

**Note**
This application is designed for the command line (CLI) and is built using [node.js](http://nodejs.org)


## How to run ?

You can either download this repo as a zip file or clone directly through git. Pay attention when cloning as there is a `submodule` defined and has to be cloned recursively as well. This can be done via:
```shell
git clone --recursive http://github.com/ahmadassaf/opendata-checker
```

**Note** If you have cloned without --recursive, you may find out that some folders are empty. To fix this:

`git submodule update --init`

Now, you will need 
