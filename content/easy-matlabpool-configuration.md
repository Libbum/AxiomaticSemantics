+++
title = "Easy Matlabpool Configuration"
description = "Dive in without caring how deep it is."
tags = ["Matlab"]
date = 2014-11-13
aliases = ["/posts/2014-11-13-Easy-Matlabpool-Configuration.html"]
[extra]
banner = "bokeh"
+++

The new `parpool` option for `Matlab 2014b` is depreciating `matlabpool`, merging the ideas of parallelisation locally and remotely in to one.
Now, the same code can be easily sent off to a large, remote cluster or ran over a few more cores on your own machine without much hassle.
Another useful feature is the fact that idle pools will close down after inactivity, allowing you to be lazy with your implementations, while at the same time giving the possibility of efficiency if you require the pool again inadvertently.

<!-- more -->
A caveat that I find with this implementation is the freedom to alter the pool size dynamically.
Most may not find this an issue, and are happy with setting the pool to 8 and be done; but if writing large amounts of info to disk constantly is your jam this is seldom the optimal choice.
At least for my routines, writing to platter isn't efficient above 2 threads, and to flash disks, 6 appears optimal.
Also: what if you want some cycles free to actually operate your machine whilst its actively causing the [heat death](https://en.wikipedia.org/wiki/Heat_death_of_the_universe)?

``` matlab
    function pool(num)
    p = gcp('nocreate'); % If no pool, do not create new one.
    if isempty(p)
        %poolsize = 0;
        parpool(num);
    else
        poolsize = p.NumWorkers;
        if poolsize ~= num
            delete(gcp);
            parpool(num);
        end
    end
    end
```

This function asks for `num`ber of pools you wish to be created.
If a pool of that size is currently active, nothing is required of the function and your code will continue.
Otherwise, the old pool is shut down and a new one is generated.
Personally, I'd like a future release to enable user access to set the read only attribute `p.NumWorkers`, but I guess we all can't get everything we want in life.
