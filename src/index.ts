import ytdl from '@distube/ytdl-core';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import fetch from 'node-fetch';

const app = new Hono();

async function getVideoId() {
  let url = 'https://yt-iptv.vercel.app/';

  const res = await fetch(url);
  const htmlString = await res.text();

  const regex = /VideoId:\s*<!--\s*-->[\s\S]*?(\w+)/;
  const match = htmlString.match(regex);

  let videoId = 'o4VoYbT9rWo';
  if (match && match[1] !== 'h1') {
    videoId = match[1];
  } else {
    console.log('VideoId not found');
  }
  console.log(videoId);
  return videoId;
}

app.get('/stream', async (c) => {
  const videoId = await getVideoId();

  const data = await ytdl.getInfo(videoId);
  const format = data.formats.reverse().find((f) => f.hasVideo && f.hasAudio);

  if (!format) {
    return c.text('Video not found', 404);
  }

  const response = await fetch(format.url);

  if (!response.ok) {
    return c.text('Error fetching video', 500);
  }

  return new Response(response.body as any, {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-cache',
    },
  });
});

const port = Number(process.env.PORT || 3000);
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
