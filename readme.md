# Networked pendulums

## Running

You may run the servers individually by respective `pnpn` commands, or run `start.sh` to run 5 instances and the front-end all at once.
Alternatively, a docker-compose file is provided to run the servers and front-end together.

## Tools

My IDE has had the SuperMaven plugin installed since I first learned of it. I use the free tier. In truth it seems far too fast to be networked in any way, and as I write this, looking for the site to credit, I've learned it's being [sunset](https://supermaven.com/blog/sunsetting-supermaven). What a shame. SuperMaven provides tab-completion suggestions, which I've used in this project.

I have access to Claude Code, by Anthropic. The generation of tests, routine work and similar other tasks was useful to get to the iteration phase, especially in pruning the template code.

## Notes

I wondered during development if my current O(n^2) collision propagation algorithm was the best way to handle networked collisions. Chiefly, I wondered about a more network-efficient O(n) neighbour-only setup where each pendulum sim is only aware of, and thus only notifies, it's two (or fewer) immediate neighbours. The downsides to that approach, abstracting this to an approach where the pendulums are instead machines, are of course safety, where a failed node would not propagate the chain past any failures. This seemed less than ideal, and building fault-tolerance for pendulums sounded wildly out of scope.

Instead, I merely statically computed at setup (and config update) which nodes one cannot possibly mathematicaly collide with.

I encountered congested networks what with the REST API and peer polling, and discovered a neat [pattern in AbortControllers](https://www.localcan.com/blog/abortcontroller-nodejs-react-complete-guide-examples) for streaming data. Functionally, I'm appying SSE to the pendulum peers as well. This is to me (at least), novel, and would not reflect how I would handle a production task just out of inexperience with the method as applied to realtime, but this entire exercise was fun, so I found it appropriate to experiment.

## Acknowledgements

- [Node.JS template](https://github.com/edwinhern/express-typescript) by [Edwin Hernández](https://github.com/edwinhern)
- [Vite Starter](https://vite.dev/guide/) by [Evan You](https://github.com/yyx990803)
