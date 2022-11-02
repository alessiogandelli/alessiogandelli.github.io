<h2>{ titles[type] }</h2>
<div class="boxes">
    {#each boxes as b}
    <div class="{b.flipped ? 'box flipped' : 'box'}">
        <div class="box-img">
            { #if b.img }
            <img loading="lazy" src="{ b.img }" alt="">
            { /if }
        </div>
        <div class="box-title">
            <h3>
                { b.title }
            </h3>
            { #if b.subtitles }{#each b.subtitles as s}
                <div class="subtitle">
                    { #if s.flag } <img loading="lazy" src="./images/flags/{s.flag.toLowerCase()}.svg" alt="flag" class="flag" width="640" height="480"/> { /if }
                    <h4> 
                        { #if s.url }<a class="box-url" target="_blank" href="{s.url}">{ s.name }</a>{ :else }{ s.name }{ /if }{ s.text }
                    </h4>
                </div>
                { /each }{ /if }
        </div>
        <div class="box-description">
            <p>{@html b.description }</p>
            { #if b.more }
                { #if b.showMore } <p class="more">{@html b.more }</p> { /if }
                <p class="show-more" on:click={ () => { b.showMore = !b.showMore} }>{b.showMore ? 'Show less' : 'Show more'}</p>
            { /if }
            <span class="fi fi-gr"></span> <span class="fi fi-gr fis"></span>

        </div>
    </div>
    {/each}
</div>

<script lang="ts">
    import { It, Se, De, Es} from "svelte-flag-icons";
    export let type: string;

    const flagsComp = { It, Se, De, Es }

    type Box = {
        img?: string,
        title: string,
        subtitles?: { flag?: string, text: string, name: string, url?: string }[],
        description: string,
        more?: string,
        showMore?: boolean,
        flipped?: boolean
    };

    const titles = {
        Education: 'Education',
        Experience: 'Work Experiences',
        Projects: 'Other Experiences'
    };

    const infos: { [id: string]: Box[] } = {
        Education: [
            {
                img: "./images/unitn.png",
                title: "Attending Master's in Data Science",
                subtitles: [
                    { flag: "It", name: "UniTn", text: ", Trento, Italy | September 2021 - September 2023", url: "https://www.unitn.it/" },
                ],
                description: "\
                I am currently attending a multidisciplinar Master degree in Trento in Data Science, with a minor in Sociology.\
                 ",
                showMore: false,
                more: "The complete list of courses I have taken:\
                <ul>\
                <li>Big Data Technologies</li>\
                <li>Data Mining</li>\
                <li>Data visualization</li>\
                <li>Foundations of Social and Psychological Science</li>\
                <li>Information, Knowledge and Service Management</li>\
                <li>introduction to Machine Learning</li>\
                <li>Law and Data</li>\
                <li>Professional English for Data Science</li>\
                <li>Statistical Learning</li>\
                <li>Statistical Methods</li>\
                </ul>\
                <br />\
                Courses I am currently attending:\
                <ul>\
                <li>Advanced social network analysisy</li>\
                <li>Digital social data</li>\
                <li>Geospatial analysis and representation for data science</li>\
                <li>Innovation and Entrepreneurship Basic</li>\
                <li>Social Dynamics Lab</li>\
                </ul>\
                "
            },
            {
                img: "./images/unitn.png",
                title: "Bachelor's in Computer Science",
                subtitles: [
                    { flag: 'It', name: "University of Trento", text: ", Trento, Italy | September 2018 - July 2022", url: "https://www.unitn.it/" }
                ],
                description: "\
                I have taken courses in Software Engineering, Data Structures, Algorithms, and Programming and Mathematics.\
                I graduated in July 2022",
                showMore: false,
                more: "The complete list of courses I have taken:\
                <ul>\
                <li>Algorithms and Data Structures</li>\
                <li>Computer Programming 1</li>\
                <li>Programming Languages</li>\
                <li>Software Engineering 1 & 2</li>\
                <li>Formal Languages and Compilers</li>\
                <li>Geometry and Linear Algebra</li>\
                <li>Calculus 1</li>\
                <li>Probability and Statistics</li>\
                <li>Mathematical Foundations of Computer Science</li>\
                <li>Physics</li>\
                <li>Operating Systems</li>\
                <li>Logic</li>\
                <li>Databases</li>\
                <li>Networks</li>\
                <li>Computer Architectures</li>\
                <li>Human-Computer Interaction</li>\
                <li>Introduction to Computer and Network Security</li>\
                <li>Introduction to Web Programming</li>\
                <li>Social psychology</li>\
                <li>Introduction to Machine Learning</li>\
                </ul>\
                "
            },
        ],
        Experience: [
            {
                flipped: true,
                img: "./images/wiki.webp",
                title: "Data Science Internship",
                subtitles: [
                    { flag: 'Es', name: "Eurecat", text: ", Barcelona, Spain | January - June 2021", url: "https://www.eurecat.org/" }
                ],
                description: "Analyzingc Reverts and edit wars on wikipedia ."
            },
            {
                flipped: true,
                img: "./images/unitn.png",
                title: "Linguistic Center Division Test Center and Online Teaching",
                subtitles: [
                    { flag: 'It', name: "UniTn", text: ", Trento, Italy | July 2020 - july 2021" }
                ],
                description: "my role was to help teachers to handle online degrees on zoom"
            },
            {
                flipped: true,
                img: "./images/saf.jpg",
                title: "Computer assistant",
                subtitles: [
                    { flag: 'It', name: "SAF-GEST srl", text: ", Rodengo Saiano, Italy | June 2020 - current" }
                ],
                description: "I give general help regarding all the computer activities of the company but I spend most of the time developing a system that allows companies to automatically generate electronic invoices for the revenue agency (agenzia delle entrate). This is not a full time job."
            },
        ],
        Projects: [
            {
                img: "./images/soi.jpg",
                title: "School of Innovation",
                subtitles: [
                    { flag: 'It', name: "SOI", text: ", Trento, Italy | July 2022", url: "https://www.soi.unitn.it" }
                ],
                description: "Extracurricolar program at Università di Trento focused on innovation and entrepreneurship, I'm following the courses: Empathy and innovation, From Idea to business idea. I also attend a challenge called \"design your future \" in collaboration with Muse a Museum in Trento where the goal is design a game to let children engage with syntehtic biology."
            }
            // {
            //     // img: "./images/fal.webp",
            //     title: "Company websites",
            //     description: "Developed two websites to for local companies with php. I also took care of taking pictures and video to promote their products."
            // },
            // {
            //     // img: "./images/kent.webp",
            //     title: "Kent School of English",
            //     subtitles: [ { flag: 'Gb', text: "Kent, United Kingdom | Semptember 2016" } ],
            //     description: "I took a two week course in English at Kent School of English"
            // }
        ],
    };

    const boxes = infos?.[type] ?? [];

</script>


<style lang="less">
    h3 {
        font-size: 1.2em;
        margin: 3px 0;
    }
    .subtitle {
        display: flex;
        align-items: center;
        h4 {
            font-size: 1em;
            margin: 3px 0;
        }
        .flag {
            height: 1.3em;
            width: 1.8em;
            margin-top: 3px;
            margin-bottom: 3px;
            margin-right: 0.5em;
        }
    }
    .box {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
        padding: 1em 3em;
        column-gap: 3em;
        border-bottom: 1px solid var(--theme);

        @media screen and (max-width: 800px) {
            grid-template-columns: auto;
            grid-template-rows: auto auto;
            column-gap: 0;
            padding: 1em;

            .box-img {
                grid-row: auto !important;
                grid-column: auto !important;
                img {
                    margin-bottom: 1em;
                }
            }
        }

        &:last-child {
            border-bottom: none;
        }
        
        .box-img {
            align-self: flex-start;
            justify-self: center;
            grid-row: 1 / 3;
            img {
                border-radius: 25%;
                width: 120px;
                height: 120px;
            }
        }
        
        &.flipped {
            .box-img {
                grid-column: 2 / 3;
            }
        }

        .box-url {
            color: inherit;
            text-decoration: underline;
        }

    }
</style>