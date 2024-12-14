


import React, { useState, useEffect } from "react";

const clientId = '27e5a678ded9406f9eac4d869726a110'; // Replace with your Client ID
const clientSecret = 'd1a8e945d82c44df84ad6faa7a7f713b';// Replace with your Client Secret
const redirectUri = "http://localhost:3000/callback"; // Replace with your redirect URI
const scopes = "user-read-private user-read-email user-library-read";

const SpotifySongSearch = () => {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState('');
  const [query, setQuery] = useState("taylor swift");
  const [songs, setSongs] = useState([]);
  const [expirationTime, setExpirationTime] = useState(0);
 /* useEffect( ()=> {
    const fetchAccessToken = async () => {
      var url = 'https://accounts.spotify.com/api/token';
      var options = {
        method: 'POST',
        headers: {
          "Content-Type" : "application/x-www-form-urlencoded",
        }, 
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      }
      
      try {
        const result = await fetch(url, options);
        const data = await result.json();
        setAccessToken(data.access_token);
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
       
    }
   
      

    fetchAccessToken();
  },[]);*/



  const handleLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
  };


  useEffect(()=> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if(code) {
      fetchAccessToken(code);
    }

  },[]);

  const fetchAccessToken = async (code) => {
    const url = "https://accounts.spotify.com/api/token";
    const bodyParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code, // Authorization code from URL
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });
  
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        
      },
      body: bodyParams.toString(),
    };
  
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Failed to fetch access token: ${response.status}`, errorDetails);
        return;
      }
      const data = await response.json();
      console.log("Token response data:", data);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setExpirationTime(Date.now() + data.expires_in *1000 );
      scheduleTokenRefresh(data.expires_in - 60);
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
  };
  

  const refreshAccessToken = async () => {
    try {
      const url = "https://accounts.spotify.com/api/token";

    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId
      }),
    }
    const response = await fetch(url, payload);
    const data = await response.json();
      setAccessToken(data.access_token);
      setExpirationTime(Date.now()+ data.expires_in * 1000 );

      scheduleTokenRefresh(data.expires_in - 60);
    } catch(error) {
      console.log(error);
    }
  }

  const scheduleTokenRefresh = (delayInSeconds) => {
    setTimeout(() => {
      refreshAccessToken();
    }, delayInSeconds * 1000);
  };

  async function SearchSong() {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
    
  
    const authorizationSearch = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json', // Fixed incorrect 'applications/json' to 'application/json'
        "Authorization": `Bearer ${accessToken}` // Added a space after 'Bearer' and used template literals for clarity
      }
    };
  
    try {
      const res = await fetch(url, authorizationSearch);
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json(); // Awaited the response JSON parsing
      setSongs(data.tracks.items); 
    } catch (error) {
      console.error('Error fetching song:', error);
    }

    
  }

  console.log("Access Token:", accessToken);
  console.log("Refresh Token:", refreshToken);
  console.log("Token Expiration:", new Date(expirationTime).toISOString());

  return (
    <div>
      <button onClick={handleLogin}>Login to Spotify</button>
      <h1>Spotify Song Search</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a song"
      />
      <button onClick={SearchSong}>Search</button>

      <ul>
        {songs.map((song) => (
          <li key={song.id}>
            <p>{song.name}</p>
            <p>Artist: {song.artists.map((artist) => artist.name).join(", ")}</p>
            <a href={song.external_urls.spotify} target="_blank" rel="noopener noreferrer">
              Listen on Spotify
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
 
};

export default SpotifySongSearch;
