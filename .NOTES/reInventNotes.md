<!-- no-select -->



### 2020-12-15

#### AWS Fault Injection Simulator: Fully managed chaos engineering service
- case making for chaos engineering
	- not just for "simple" apps
	- dynamic environments
	- config drift
	- resource failure
	- black hole - fail fast is good, but can also cause outage
- define chaos engineering
	- intentional failure, fault injection
	- watch how system responds
	- controlled environment
	- not just about resilience, also performance, recovery, response time
	- not really about randomness, has a well-defined method
- difficulties in adopting chaos engineering
	- stitching together libs
	- agents or libs required
	- difficult to ensure safety
- aws solution
	- tags
	- iam roles
	- json/yaml config file
	- target one or multiple resource
	- experiment
	- use alarms recommended
	- faults supported
- demos
	- ...
	- ...
	- stop instances in one region
		- experiement rollback is optional
	- CPU stress fault
		- uses a template
