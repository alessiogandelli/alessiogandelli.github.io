<h2>Personal Projects</h2>
<div class="somethings">
    {#each projects as prjs}
    <div class="something">
        <h3>{ prjs.name }</h3>
        <div class="list">
            { #each prjs.projects as p }
            <a href="{p.link}" target=”_blank” >
                <p class="name">{p.name}</p>
                <p class="description">{p.description}</p>
            </a>
            { /each }
        </div>
    </div>
    { /each }
</div>
<div class="more-github">
    <a href="https://github.com/nicolatoscan" target="_blank">
        <p>And many more on my Github</p><Github size='32' />
    </a>
</div>


<script lang="ts">
    import Github from "svelte-material-icons/Github.svelte";

    type Project = { name: string, description: string, link: string }
    const projects: { name: string, projects: Project[] }[] = [
       { name: "Data Science", projects: [
            { name: "Covid dashboard", link: "https://github.com/alessiogandelli/covid-dashboard-unitn", description: "University project of big data technologies, implemented using Kafka, Postgres, Kafka and mongodb" },
            { name: "Computer Vision: image retriaval",         link: "https://github.com/alessiogandelli/machine-learning-unitn",    description: "I implemented a siamese network to find the most similar image from a gallery" },
            { name: "Spotify network analysis",    link: "https://github.com/alessiogandelli/feat-network",           description: "Network analysis of spotify singers (in progress)" },
            { name: "Wikipedia Revert analysis",    link: "https://github.com/WikiCommunityHealth/wikimedia-revert", description: "Analysis of wikipedia revert" },
            { name: "Geospatial ",                 link: "",        description: "in progress" },
            { name: "Attention analysis",          link: "",        description: "University project: Analyse phone sensors data to study the attetion that students give to their phone (in progress)" },
            { name: "Twitter analysis",          link: "",        description: "University project: Analyse twitte data (in progress)" },

        ] },
        { name: "Telegram Bots", projects: [
            { name: "Chess, pgn to url",                link: "https://github.com/alessiogandelli/import-chess-game-bot",                 description: "A telegram bot that given a game in pgn format returns a url where you can visualise the game " },
            { name: "Bottana translator",                      link: "https://github.com/alessiogandelli/bottana",                                description: "A telegram bot that uses Deepl api to translate messages in a group chat or sent directly to the bot " },
        ] },
        { name: "node module", projects: [
            { name: "create-xml",       link: "https://github.com/alessiogandelli/create-xml-module", description: "node module that collect data from ninox and generate a xml according to the format provided by the Italian financial ministry" },
            ,
        ] },
        
        
    ] 

</script>


<style lang="less">
    a {
        color: inherit;
    }
    .something {
        max-width: 780px;
        margin: auto;
        border-bottom: 1px solid var(--theme);
        padding: 1.5em;

        .list {

            a {
                display: grid;
                grid-template-columns: 1fr 3fr;
                grid-gap: 2em;
                border-radius: 5px;
                padding: 0.3em;

                &:hover {
                    background-color: var(--theme-background);
                }

                p {
                    margin: 0;
                }
                p.name {
                    color: var(--theme);
                    text-align: right;
                    text-decoration: underline;
                }
            }
        }

        &:last-child {
            border-bottom: none;
        }
        
        h3 {
            margin-top: 0;
            text-align: center;
            font-weight: bolder;
            color: var(--theme);
        }
    }

    .more-github {
        display: flex;
        justify-content: center;
        a {
            display: inline-block;
            text-transform: uppercase;
            font-size: 1.2em;
            margin-top: 2em;
            padding: 1em;
            border-radius: 5px;
            display: flex;
            align-items: center;
            background-color: var(--theme);
            color: var(--color-bg);

            p {
                margin: 0;
                margin-right: 1em;
            }
            &:hover {
                text-decoration: none;
                background-color: var(--theme-select);
            }
        }
    }
    :global(.more-github path) {
        fill: var(--color-bg) !important;
    }
</style>