/* 
    Name:       Reeve Jarvis
    Course:     DGL-213
    Section:    DLU1
    Original:   Module #3 Milestone #2

    Current: Module #3.5 Refactoring
    Latest Update: 11/18/2021

    Filename:   main.js

    ** To allow data response and avoid CORS issues, this must be run with a proxy server. See proxy.js for instructions. **
*/

/* eslint-disable no-undef */ 
"use strict";

/***** Map Initialization *****/

const mymap = L.map("locationMap").setView([0, 0],2);
const attribution = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors";
const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(mymap);

/***** User Interface references *****/

let cityEntry1 = document.getElementById("city1");
let citySearch = document.getElementById("citySearch");
citySearch.addEventListener("click", getFormValues);

let cityEntry2 = document.getElementById("city2");
let dateEntry = document.getElementById("date");
let cityDateSearch = document.getElementById("cityDateSearch");
cityDateSearch.addEventListener("click", getFormValues);

document.getElementById("currentLocation").addEventListener("click", getCurrentLocation);
let weatherOutput = document.getElementById("weatherOutput");

/***** Node proxy details *****/

const proxyUrl = "http://127.0.0.1:3000";

const requestInit = { 
    method: "GET", 
    mode: "cors", 
    cache: "default" 
};

/***** Page update handler *****/

function updatePage(queryDetails, weather) {
    displayLocation(queryDetails);
    addMarker(queryDetails, weather);
    displayWeatherData(weather);
}

/***** Data searching functions based on user input *****/

async function searchByCurrentLocation(position){
    let queryDetails = { lat: position.coords.latitude, lon: position.coords.longitude};
    const response = await getLocationData(queryDetails);
    queryDetails = updateQueryDetails(queryDetails, response);
    const weather = await getWeatherData(queryDetails);
    updatePage(queryDetails, weather);
}

async function userSearch(queryDetails){
    const response = await getLocationData(queryDetails);
    if(response.length == 0){
        clearLocationInfo();
        weatherOutput.innerText = "Sorry no data. Please try the next closest major city.";
        return;
    } else {
        queryDetails = updateQueryDetails(queryDetails, response);
        const weather = await getWeatherData(queryDetails);
        if(Object.hasOwnProperty.call(weather, "consolidated_weather")){
            updatePage(queryDetails, weather);
        } else {
            const consolidatedWeather = {"consolidated_weather": weather.slice(0,1)};
            updatePage(queryDetails, consolidatedWeather);
        }
        
    } 
}

/***** Helper functions *****/

function getFormValues(event) {
    let queryDetails;
    if(event.target == citySearch){
        queryDetails = {title: cityEntry1.value};
        cityEntry1.value = "";
    }
    if(event.target == cityDateSearch){
        queryDetails = {title: cityEntry2.value, date: dateEntry.value.split("-")};
        cityEntry2.value = "";
        dateEntry.value = "";
    }
    userSearch(queryDetails);
}

function updateQueryDetails(queryDetails, response) {
    const coordinates = response[0]["latt_long"].split(",");
    queryDetails.lat = coordinates[0];
    queryDetails.lon = coordinates[1];
    queryDetails.title = response[0].title;
    queryDetails.woeid = response[0].woeid;
    return queryDetails;
}

function clearLocationInfo() {
    document.getElementById("title").innerText = "";
    document.getElementById("lat").innerText = "";
    document.getElementById("lon").innerText = "";
}

/*****  Location-related functions *****/

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(searchByCurrentLocation, (error) => {
            console.log(error); 
        });
    } else {
        console.log("Location services not enabled.");
    }
}

async function getLocationData(queryDetails){
    let locationEndpoint = (Object.hasOwnProperty.call(queryDetails, "title")) ? `/search/?query=${queryDetails.title}`: `/search/?lattlong=${queryDetails.lat},${queryDetails.lon}`;
    const response = await fetch(proxyUrl + locationEndpoint, requestInit).catch((error) => {
        console.log(error);
    });
    const data = await response.json();
    return data;
}

function displayLocation(position) {
    document.getElementById("title").innerText = position.title;
    document.getElementById("lat").innerText = parseFloat(position.lat).toFixed(2);
    document.getElementById("lon").innerText = parseFloat(position.lon).toFixed(2);
    mymap.setView([position.lat, position.lon], 10);
}

function addMarker(position, data){
    var weatherIcon = L.icon({
        iconUrl: `https://www.metaweather.com/static/img/weather/${data["consolidated_weather"][0]["weather_state_abbr"]}.svg`,
        iconSize: [150, 75],
        iconAnchor: [0, 0]
    });
    const marker = L.marker([position.lat, position.lon], {icon: weatherIcon});
    marker.addTo(mymap);
}

/***** Weather related functions *****/

async function getWeatherData(queryDetails) {
    let weatherEndpoint = (Object.hasOwnProperty.call(queryDetails, "date")) ? `/${queryDetails.woeid}/${queryDetails.date[0]}/${queryDetails.date[1]}/${queryDetails.date[2]}`: `/${queryDetails.woeid}`;
    const nearestLocationData = await fetch(proxyUrl + weatherEndpoint, requestInit).catch((error) => {
        console.log(error);
    });
    const weatherData = await nearestLocationData.json();
    return weatherData;
}

function createWeatherIcon(day){
    let weatherStateImage = document.createElement("img");
    weatherStateImage.setAttribute("src", `https://www.metaweather.com/static/img/weather/${day["weather_state_abbr"]}.svg`);
    weatherStateImage.setAttribute("alt", `${day["weather_state_name"]}`);
    weatherStateImage.classList.add("w-100","h-25", "mb-3");
    return weatherStateImage;      
}

function displayWeatherData(weatherData) {
    while(weatherOutput.firstChild){
        weatherOutput.removeChild(weatherOutput.firstChild);
    }
    const forcast = weatherData["consolidated_weather"];
    for (let day of forcast){
        let list = document.createElement("ul");
        list.classList.add("list-unstyled", "mx-auto", "p-2", "border","border-dark", "bg-white");
        let weatherIcon = createWeatherIcon(day);
        list.appendChild(weatherIcon);

        for (let key of Object.keys(day)) {
            switch (key){
                case "applicable_date":{
                    let listItem = document.createElement("li");
                    listItem.classList.add("mb-3");
                    let details = `Date: ${day[key]}`;
                    listItem.innerText = details;
                    list.prepend(listItem);
                    break;
                }
                case "weather_state_name": {
                    let listItem = document.createElement("li");
                    let details = `Expected: ${day[key]}`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                case "min_temp":{
                    let listItem = document.createElement("li");
                    let details = `Low-Temp: ${day[key].toFixed(2)}°`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                case "max_temp":{
                    let listItem = document.createElement("li");
                    let details = `High-Temp: ${day[key].toFixed(2)}°`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                case "the_temp":{
                    let listItem = document.createElement("li");
                    let details = `Currently: ${day[key].toFixed(2)}°`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                case "humidity":{
                    let listItem = document.createElement("li");
                    let details = `Humidity: ${day[key]}%`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                case "predictability":{
                    let listItem = document.createElement("li");
                    let details = `Predictability: ${day[key]}%`;
                    listItem.innerText = details;
                    list.appendChild(listItem);
                    break;
                }
                default:{
                    break;
                } 
            }
        }
        weatherOutput.appendChild(list);
    }
}