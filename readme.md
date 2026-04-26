# Networked pendulums

## Running

## Tools

My IDE has had the SuperMaven plugin installed since I first learned of it. I use the free tier. In truth it seems far too fast to be networked in any way, and as I write this, looking for the site to credit, I've learned it's being [sunset](https://supermaven.com/blog/sunsetting-supermaven). What a shame. SuperMaven provides tab-completion suggestions, which I've used in this project.

## Notes

I wondered during development if my current O(n^2) collision propagation algorithm was the best way to handle networked collisions. Chiefy, I wondered about a more network-efficient O(n) neighbour-only setup where each pendulum sim is only aware of, and thus only notifies, it's two (or fewer) immediate neighbours. The downsides to that approach, abstracting this to an approach where the pendulums are instead machines, are of course safety, where a failed node would not propagate the chain past any failures. This seemed less than ideal, and building fault-tolerance for pendulums sounded wildly out of scope.

Instead, optimizations could be made my statically computing at setup which nodes one cannot possibly mathematicaly collide with. Were we ever expanding this network of pendulums, maybe that might be the right approach.

## Acknowledgements

- [Node.JS template](https://github.com/edwinhern/express-typescript) by [Edwin Hernández](https://github.com/edwinhern)
- [Zod](https://github.com/colinhacks/zod) by [Colin McDonnell](https://github.com/colinhacks)
- [Pino](https://github.com/pinojs/pino) by [Matteo Collina](https://github.com/pinojs)
