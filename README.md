
Plugin UI Installation Instructions
===================================

Prepare the Plugin locally for Installation
-------------------------------------------

-   *in the local shell, go to (or create and go to) your working directory for the project, let’s call this <project_path>*
-   [local-terminal]$ cd <project_path>

-   get the esxui-docker-volume-plugin plugin repo (TBD)
-   [local-terminal]$ cd esxui-docker-volume-plugin

-   install node/npm and grunt if necessary
-   [local-terminal]$ npm install

### Production build

-   [local-terminal]$ grunt

-   **production build** of esxui-docker-volume-plugin will now be in ./build/dist/

### Development build

For development we want to bypass the uglify step to allow for in-browser debugging (TODO: setup dev and prod environments that don’t involve shitty hacks to Gruntfile)

-   edit Gruntfile.js
-   add the following 2 lines to the copy.dist.files.src array
        'scripts/**/{,*/}*.*',
        'plugin.js'

-   comment out the following line in second argument to grunt.registerTask
        'uglify'

-   [local-terminal]$ grunt

-   **development build** of esxui-docker-volume-plugin will be in ./build/dist/

Spin up an ESXi
---------------

-   Install and Launch VMWare Fusion
-   Download OVA: **VMWare ESXi 6u2.ova**
-   File &gt; New &gt; Import Virtual Machine
-   Choose the OVA you just downloaded
-   follow the wizard until ESXi is created

Install Docker Volume Plugin
----------------------------

### Prepare the ESXi

-   Get the IP address for the newly-created ESXi from the Fusion status screen
-   let’s call that IP address “vm\_ip”
-   [local-terminal]$ ssh root@<vm_ip>

-   enter password
-   [root@localhost]$ cd /usr/lib/vmware/hostd/docroot/ui/

-   [root@localhost]$ mkdir -p plugins/esxui-docker-volume-plugin &amp;&amp; cd plugins/esxui-docker-volume-plugin

### Copy esxui-docker-volume-plugin build onto the ESXi

-   start a new local terminal, we’ll call it \[local-terminal-2\]
-   [local-terminal-2]$ cd <project_path>

-   [local-terminal-2]$ tar -cvzf esxui-docker-volume-plugin.tar.gz –directory=“./esxui-docker-volume-plugin/build/dist” .

-   [local-terminal-2]$ scp esxui-docker-volume-plugin.tar.gz root@<vm_ip>:/usr/lib/vmware/hostd/docroot/ui/plugins/esxui-docker-volume-plugin/esxui-docker-volume-plugin.tar.gz

-   enter password
-   [local-terminal]$ rm esxui-docker-volume-plugin.tar.gz

### Install esxui-docker-volume-plugin on the ESXi

-   [root@localhost]$ tar -xvzf esxui-docker-volume-plugin.tar.gz

-   [root@localhost]$ rm esxui-docker-volume-plugin.tar.gz

Launch the ESXi UI to confirm that Plugin is available
------------------------------------------------------

-   point your browser at <http://><project_path>/ui
