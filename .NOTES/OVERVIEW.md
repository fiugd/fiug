<!-- no-select -->

#### Bartok Overview


The following graphic helps me think clearly about how bartok is put together and what it is.


#### Service Map Loaded into UI

It's important to note that Local Storage and Backend service are included in the Service Map.

In the service map, they are represented as code which can be deployed.

Outside the service map, they exist as running instances of services that deploy and code.


```
+-----------------------------------------------------------+
|        SERVICE MAP                                        |
+-----------------------------------------------------------+
|                                                           |
|      +---------------------+ +---------------------+      |
|      | TEMPLATES           | | CONFIG              |      |
|      +---------------------+ +---------------------+      |
|      |                     | |                     |      |
|      | construction        | | connection          |      |
|      |                     | |                     |      |
|      |                     | |                     |      |
|      |                     | |                     |      |
|      |                     | |                     |      |
|      +---------------------+ +---------------------+      |
|                                                           |
|      +---------------------------------------------+      |
|      | SERVICE 1                                   |      |
|      +---------------------------------------------+      |
|      |                                             |      |
|      |  +---------+    +---------+    +---------+  |      |
|      |  |         |    |         |    |         |  |      |
|      |  | FILE 1  |    | FILE 2  |    | FILE 3  |  |      |
|      |  |         |    |         |    |         |  |      |
|      |  +---------+    +---------+    +---------+  |      |
|      |                                             |      |
|      +---------------------------------------------+      |
|                                                           |
|      +---------------------------------------------+      |
|      | SERVICE 2                                   |      |
|      +---------------------------------------------+      |
|      |                                             |      |
|      |  +---------+    +---------+    +---------+  |      |
|      |  |         |    |         |    |         |  |      |
|      |  | FILE 1  |    | FILE 2  |    | FILE 3  |  |      |
|      |  |         |    |         |    |         |  |      |
|      |  +---------+    +---------+    +---------+  |      |
|      |                                             |      |
|      +---------------------------------------------+      |
|                                                           |
+-----------------+---+-------------------------------------+
                  |   ^
                A1| A2|
                  v   |
          +-------+---+--------+   B1   +------------+
          | Local Storage      +------->+            |
          +--------------------+        |  Browser   |
          |                    |   B2   |  Storage   |
          |                    +<-------+            |
          +-------+---+--------+        +------------+
                  |   ^
                C1| C2|
                  v   |
          +-----------+--------+   D1   +------------+
          | Bartok Backend     +------->+            |
          +--------------------+        |  Server    |
          |                    |   D2   |  Storage   |
          |                    +<-------+            |
          +--------------------+        +------------+
```



#### Connections

 A1/A2 - code is pushed and pulled
         this may result in browser service restart

 B1/B2 - code read and written to browser storage

 C1/C2 - code read and written to backend
         backend services may restart

 D1/D2 - code read and written to a DB of choice


#### Notes

Templates|Config:
   service code bases that are not deployed

Templates:
   code that gets added to services when deployed

Config:
   code that controls how services are connected
   (to each other and outside world)

Local Storage
   connected to browser events and state
   bootstrapped by UI source
   can be edited and configured like any other service map

Bartok Backend
   connected to browser through API's (depends on config)
   bootstrapped by server source
   can be edited and configured like any other service map
