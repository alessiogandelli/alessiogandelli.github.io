<h2>ABOUT ME</h2>
<div class="my-info">
    <p><span class="info-name">Name:</span>Alessio Gandelli</p>
    <p><span class="info-name">From:</span>Italy</p>
    <p><span class="info-name">Age:</span>{ age }</p>
    <p><span class="info-name">Now in:</span>Trento (it) </p>
</div>
<div class="about">
    <div class="picture"></div>
    <p>
        I'm a { age } years old Italian student, currently attending a Masters Degree in Data Science at UniTn.<br />
        I'm passionate about data science, human behaviour and innovation.
    </p>
</div>
<div class="urls">
    <a href="https://www.github.com/alessiogandelli/"      aria-label="GitHub"   class="themed-icon" target="_blank"><Github   size='48' /> </a>
    <a href="https://www.linkedin.com/in/alessio-gandelli-36289a181/" aria-label="LinkedIn" class="themed-icon" target="_blank"><Linkedin size='48' /> </a>
    <a href="mailto:alessiogandelli99@gmail.com"                      aria-label="Email"    class="themed-icon" target="_blank"><Email    size='48' /> </a>
    <a href="https://www.t.me/d8eea/"            aria-label="Telegram" class="themed-icon" target="_blank"><Telegram size='48' /> </a>
</div>
<div class="download-as-pdf">
    <a href="./files/curriculum2022.pdf" target="_blank">
        <p>Download resume as PDF</p><PdfBox size='32' />
    </a>
</div>


<script lang="ts">
    import Github from "svelte-material-icons/Github.svelte";
    import Linkedin from "svelte-material-icons/Linkedin.svelte";
    import Email from "svelte-material-icons/Email.svelte";
    import Telegram from "svelte-material-icons/Telegram.svelte";
    import PdfBox from "svelte-material-icons/PdfBox.svelte";

    const age = Math.floor( (new Date().getTime() - new Date(1999, 0, 31).getTime()) / 3.15576e+10 );
</script>


<style lang="less">
    .my-info {
        width: fit-content;
        margin: auto;
        display: grid;
        column-gap: 3em;
        grid-template-columns: 1fr 1fr;
        padding: 1.5em .5em;
        @media only screen and (max-width: 750px) {
            grid-template-columns: 1fr;
        }
    }
    .about {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        justify-content: center;
        @media screen and (max-width: 800px) {
            grid-template-columns: auto;
            align-items: center;
            justify-items: center;
        }
        .picture {
            width: 120px;
            height: 120px;
            background-image: url(../images/alessio-gandelli.jpeg);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 50%;
            margin: 1em;
            border: 4px solid var(--theme);
        }
    }

    .urls {
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin: 0 auto 1em;
        padding: 0.5em 3em 0;
        border-top: 1px solid var(--theme);
        width: fit-content;

        a {
            padding: .5em 1em;
        }
    }
    p {
        margin: 0.3em 1em;
        font-size: 1.3em;
        .info-name {
            width: 90px;
            display: inline-block;
            color: var(--theme);
        }
    }

    .download-as-pdf {
        display: flex;
        justify-content: center;
        a {
            display: inline-block;
            text-transform: uppercase;
            font-size: 1em;
            padding: 0.5em 2em;
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
</style>