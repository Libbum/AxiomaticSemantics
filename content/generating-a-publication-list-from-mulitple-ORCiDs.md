+++
title = "Generating a Publication List From Mulitple ORCiDs"
description = "AKA getting your professors to manage their own bloody lists so you don't have to."
tags = ["php", "tcqp"]
date = 2015-05-23
aliases = ["/posts/2015-05-23-generating-a-publication-list-from-mulitple-ORCiDs.html"]
[extra]
banner = "books"
+++

A website for my research group outside of the bounds of our abysmal university web restrictions has been discussed for quite some time. It's genesis has only really started recently though, because I've had too many other things on my plate and no-one else has any decent web capability. Whilst I'd much prefer to use a simple static site tool or code something completely from scratch, the other members of my team really need something a bit more point and click. Plus, I'll be leaving the group soon so it's in their best interest to have a well rounded CMS interface with which they can administer the site.

<!-- more -->

---

**Update 2018-04-25:** OrcID have removed the v1.2 API from their servers, meaning the code in this blog post no longer functions.
The current version v2.1 is quite annoying for our purposes, as it only returns a summary of works, not all info when we request details on a user.
We can then collect an identifier for each work and request the full content, but can only do this in batches of 50, thus the implementation of a script like the one below is no longer quite straightforward.
With that being said, the Joomla module I wrote for v1.2 has been updated to function with v2.1 and has a number of other improvements which are interesting in their own right.
You can take a look at the module on my github [here](https://github.com/Libbum/joomla-papers); the code discussed in this blog is mostly held within [`mod_papers/helper.php`](https://github.com/Libbum/joomla-papers/blob/master/mod_papers/helper.php).

---

Looking around for the latest and greatest in CMS tools (I haven't worked with one since the very early versions of **e107** 15 years ago) we came across **Joomla**, which incidentally was pre-installed on the shared hosting we'd just purchased for the site, and started porting across content. Now that I'm familiar with the system I can undoubtedly state that building something from scratch and teaching everyone in the group how to code would have been a better choice.

But I'm getting off topic&hellip;

Managing publication lists has apparently become yet another piece of administrative overhead for researchers. One needs a ResearcherID, Scopus Author ID, ORCiD, and a google scholar profile; not to mention your institutions' profile of you and—if you give two shits about the corporate world, a LinkedIn.

A publication list is one of the primary items expected on a research groups website, and we really didn't want to add yet another list to the pile. So, against my better judgment, I delved back into the underworld of **PHP** and hacked together a little **Joomla** module that pulls the publications of multiple individuals via the [ORCiD public API]. That information is then cleared of duplicates, sorted by year and displayed as a list. See it in action over at [TCQP.Science].

```php
<?php
//Align most sanitised to least, will prefer data from earlier in the array.
$orcids = array('0000-0002-xxxx-xxxx','0000-0002-yyyy-yyyy','0000-0002-zzzz-zzzz');
foreach ($orcids as $id) {
    // create a new cURL resource
    $ch  = curl_init();
    // set URL and other appropriate options
    $options = array(
        CURLOPT_URL => 'http://pub.orcid.org/v1.2/' . $id . '/orcid-works',
        CURLOPT_HEADER => false,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER => array(
            'Accept: application/orcid+json'
        )
    );
    curl_setopt_array($ch, $options);
    // grab URL and pass it to the browser
    $raw = curl_exec($ch);
    // close cURL resource, and free up system resources
    curl_close($ch);
    //Decode json data
    $data  = json_decode($raw, true);
    //Grab usefull stuff and merge
    $works = $data['orcid-profile']['orcid-activities']['orcid-works']['orcid-work'];
    if (!empty($works)) {
        if ($id === reset($orcids)) {
            $mergedworks = $works;
        } else {
            $mergedworks = array_merge($mergedworks, $works);
        }
    }
}

//Get all dois
$dois = array();
foreach ($mergedworks as $key => $work) {
    if (!is_null($work['work-external-identifiers'])) {
        foreach ($work['work-external-identifiers']['work-external-identifier'] as $ids) {
            if (strcmp($ids['work-external-identifier-type'], 'DOI') == 0) {
                $dois[] = $ids['work-external-identifier-id']['value'];
            }
        }
        $mergedworks[$key] = array_merge($mergedworks[$key], array('parse'=>1,'udoi'=>'')); //Build a parse check field. Parse by default, set to zero if there's an issue.
    } else {
        unset($mergedworks[$key]); //For now, kill anything without a DOI.
    }
}

//Find all unique dois
$udois = array_unique($dois);

//sanitise merged array.
foreach ($mergedworks as $mkey => $work) {
    //Identify Duplicates
    foreach ($work['work-external-identifiers']['work-external-identifier'] as $ids) {
        if (strcmp($ids['work-external-identifier-type'], 'DOI') == 0) {
            $doi = $ids['work-external-identifier-id']['value'];
        $mergedworks[$mkey]['udoi'] = $doi;
            $key = array_search($doi, $udois); // Find where DOI is in the unique list

            unset($udois[$key]); //Found one, don't need another.
            if ($key === false) {
                $mergedworks[$mkey]['parse'] = 0; //Don't parse this entry
            }
        }
    }
}

//Sort array by year
usort($mergedworks, function($a, $b) {
    return ($a['publication-date']['year']['value'] > $b['publication-date']['year']['value']) ? -1 : 1;
});

$curr_year = date("Y");
$output = "<h2>" . $curr_year . "</h2>";
foreach ($mergedworks as $work) {
    //Identify Results earlier than 2011
    $year = $work['publication-date']['year']['value'];
    if ($year < '2011') {
        $work['parse'] = 0; //Don't parse this entry
    } elseif ($year < $curr_year) {
        //As our list is sorted, we've moved to the previous year now. Separate the results.
        $curr_year = $year;
        $output .= "<br><h2>" . $curr_year . "</h2>";
    }
    //Print results
    if ($work['parse'] === 1) {
        $output .= '<b>' . $work['work-title']['title']['value'] . '</b><br>';

        if (strcmp($work['work-citation']['work-citation-type'], 'BIBTEX') == 0) {
            $bibtex = $work['work-citation']['citation'];
            $volume = '';
            $pages  = '';
            if (preg_match('/volume\\s?=\\s?{(\\d+)}/', $bibtex, $match)) {
                $volume = $match[1];
            }
            if (preg_match('/pages\\s?=\\s?{([0-9-]+)}/', $bibtex, $match)) {
                $pages = $match[1];
            }
        }

        if (!is_null($work['work-contributors'])) {
            foreach ($work['work-contributors']['contributor'] as $authors) {
                if (($authors === reset($work['work-contributors']['contributor'])) && ($authors === end($work['work-contributors']['contributor']))) {
                    $output .= $authors['credit-name']['value'] . '<br>';
                } elseif ($authors === reset($work['work-contributors']['contributor'])) {
                    $output .= $authors['credit-name']['value'];
                } elseif ($authors === end($work['work-contributors']['contributor'])) {
                    $output .= ' and ' . $authors['credit-name']['value'] . '<br>';
                } else {
                    $output .= ', ' . $authors['credit-name']['value'];
                }
            }
        } else {
            //Get authorlist from bibtex
            if (preg_match('/author\\s?=\\s?{(.+)}/', $bibtex, $match)) {
                $authorstr = $match[1];
                $authors   = explode(" and ", $authorstr);
                foreach ($authors as $author) {
                    if (($author === reset($authors)) && ($author === end($authors))) {
                        $output .= $author . '<br>';
                    } elseif ($author === reset($authors)) {
                        $output .= $author;
                    } elseif ($author === end($authors)) {
                        $output .= ' and ' . $author . '<br>';
                    } else {
                        $output .= ', ' . $author;
                    }
                }
            }
        }

        $output .= '<a href="http://dx.doi.org/' . $work['udoi'] . '">' . $work['journal-title']['value'] . ' <b>' . $volume . '</b> ' . $pages . ' (' . $work['publication-date']['year']['value'] . ')</a><br>';
    }
}

echo $output;
?>
```

If you want to use this yourself, feel free to copypasta, or get in contact and I'll send you a complete module for **Joomla**. A few things you should be aware of: put the person with the cleanest list first in the array—the script doesn't merge fields it just takes the first it finds when checking against the unique key. Secondly, we don't expect a drastic amount of traffic and would like the list to be as up to date as possible, so we pull this info on each page load. If you're expecting modest traffic, perhaps look into something a little more sophisticated for the API call.

  [ORCiD public API]: http://orcid.org/organizations/integrators/API
  [TCQP.Science]: http://tcqp.science/our-science/publication-list
