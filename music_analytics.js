document.addEventListener("DOMContentLoaded", function() {
    // DOM elements
    const artistSelect = document.getElementById('artist-select');
    const timeRangeSelect = document.getElementById('time-range');
    const metricSelect = document.getElementById('metric-select');
    const trendsChart = document.getElementById('trends-chart');
    const topSongsList = document.getElementById('top-songs-list');
    const loading = document.getElementById('loading');
    const visualizationTitle = document.getElementById('visualization-title');

    // Global variables to store our data
    let allData = [];
    let uniqueArtists = new Set();
    let currentArtist = 'all';
    let currentTimeRange = 'all';
    let currentMetric = 'streams';

    // Show loading indicator
    function showLoading() {
        loading.style.display = 'block';
    }

    // Hide loading indicator
    function hideLoading() {
        loading.style.display = 'none';
    }

    // Format large numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Parse streams string to number
    function parseStreams(streams) {
        return parseInt(streams.replace(/,/g, ''));
    }

    // Load data from all JSON files in the folder
    async function loadAllData() {
        showLoading();
        
        try {
            // Hardcoded list of weekly files (in a real app, this would be fetched from an API)
            const weeks = [
                '2016-12-29', '2017-01-05', '2017-01-12', '2017-01-19', '2017-01-26',
                '2017-02-02', '2017-02-09', '2017-02-16', '2017-02-23', '2017-03-02',
                // Add more weeks as needed
            ];
            
            // Fixed path to match the correct folder structure
            const promises = weeks.map(week => 
                fetch(`./data/songs-global-weekly/${week}.json`)
                    .then(response => response.json())
            );
            
            const results = await Promise.all(promises);
            
            // Combine all data
            results.forEach(weekData => {
                weekData.forEach(song => {
                    // Parse streams to number
                    song.streams_num = parseStreams(song.streams);
                    
                    // Add each artist to our set of unique artists
                    if (song.artist.includes(',')) {
                        song.artist.split(',').forEach(artist => {
                            uniqueArtists.add(artist.trim());
                        });
                    } else {
                        uniqueArtists.add(song.artist.trim());
                    }
                    
                    allData.push(song);
                });
            });
            
            // Populate artist dropdown
            populateArtistDropdown();
            
            // Initial visualization
            updateVisualization();
            
        } catch (error) {
            console.error("Error loading data:", error);
            alert("Error loading song data. Please check the console for details.");
        } finally {
            hideLoading();
        }
    }

    // Populate artist dropdown with unique artists
    function populateArtistDropdown() {
        // Clear existing options except 'All Artists'
        while (artistSelect.options.length > 1) {
            artistSelect.remove(1);
        }
        
        // Add artist options
        const sortedArtists = Array.from(uniqueArtists).sort();
        sortedArtists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist;
            option.textContent = artist;
            artistSelect.appendChild(option);
        });
    }

    // Filter data based on current selections
    function filterData() {
        let filtered = [...allData];
        
        // Filter by artist
        if (currentArtist !== 'all') {
            filtered = filtered.filter(song => song.artist.includes(currentArtist));
        }
        
        // Filter by time range
        if (currentTimeRange !== 'all') {
            filtered = filtered.filter(song => song.week.startsWith(currentTimeRange));
        }
        
        return filtered;
    }

    // Aggregate data for visualization
    function aggregateData() {
        const filtered = filterData();
        
        // Group data by week
        const groupedByWeek = {};
        
        filtered.forEach(song => {
            if (!groupedByWeek[song.week]) {
                groupedByWeek[song.week] = {
                    week: song.week,
                    totalStreams: 0,
                    songCount: 0,
                    totalRank: 0,
                    songs: []
                };
            }
            
            groupedByWeek[song.week].totalStreams += song.streams_num;
            groupedByWeek[song.week].songCount += 1;
            groupedByWeek[song.week].totalRank += parseInt(song.rank);
            groupedByWeek[song.week].songs.push(song);
        });
        
        // Convert to array and sort by week
        const aggregated = Object.values(groupedByWeek).map(weekData => {
            return {
                week: weekData.week,
                totalStreams: weekData.totalStreams,
                avgRank: weekData.totalRank / weekData.songCount,
                songs: weekData.songs.sort((a, b) => a.rank - b.rank).slice(0, 10) // Top 10 songs
            };
        });
        
        return aggregated.sort((a, b) => new Date(a.week) - new Date(b.week));
    }

    // Create the time trend chart
    function createTrendChart(data) {
        // Clear existing chart
        d3.select("#trends-chart").html("");
        
        // Set dimensions and margins
        const margin = {top: 30, right: 50, bottom: 60, left: 80};
        const width = trendsChart.clientWidth - margin.left - margin.right;
        const height = trendsChart.clientHeight - margin.top - margin.bottom;
        
        // Create SVG and append a group element
        const svg = d3.select("#trends-chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.week)))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .range([height, 0]);
        
        // Set y-axis domain based on metric
        if (currentMetric === 'streams') {
            yScale.domain([0, d3.max(data, d => d.totalStreams)]);
        } else {
            // For rank, lower is better, so invert the scale
            yScale.domain([50, 0]);
        }
        
        // Define line generator
        const line = d3.line()
            .x(d => xScale(new Date(d.week)))
            .y(d => {
                if (currentMetric === 'streams') {
                    return yScale(d.totalStreams);
                } else {
                    return yScale(d.avgRank);
                }
            })
            .curve(d3.curveMonotoneX);
        
        // Append x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickFormat(d3.timeFormat("%b %Y")))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
        
        // Append y-axis
        const yAxis = svg.append("g")
            .call(d3.axisLeft(yScale));
        
        // Add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "#555")
            .text(currentMetric === 'streams' ? "Total Streams" : "Average Rank");
        
        // Add the line
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#1DB954")
            .attr("stroke-width", 3)
            .attr("d", line);
        
        // Add dots for each data point
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(new Date(d.week)))
            .attr("cy", d => {
                if (currentMetric === 'streams') {
                    return yScale(d.totalStreams);
                } else {
                    return yScale(d.avgRank);
                }
            })
            .attr("r", 5)
            .attr("fill", "#1DB954")
            .on("mouseover", function(event, d) {
                // Show tooltip on hover
                const metricValue = currentMetric === 'streams' 
                    ? formatNumber(d.totalStreams) + " streams"
                    : "Rank " + d.avgRank.toFixed(1);
                
                d3.select("body").append("div")
                    .attr("class", "d3-tooltip")
                    .style("position", "absolute")
                    .style("background", "rgba(0,0,0,0.7)")
                    .style("color", "white")
                    .style("padding", "10px")
                    .style("border-radius", "5px")
                    .style("pointer-events", "none")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 15) + "px")
                    .html(`
                        <strong>Week: ${d.week}</strong><br>
                        ${metricValue}<br>
                        Songs: ${d.songs.length}
                    `);
            })
            .on("mouseout", function() {
                // Remove tooltip
                d3.selectAll(".d3-tooltip").remove();
            });
    }

    // Display top songs for the latest week in the data
    function displayTopSongs(data) {
        // Sort by date to get the latest week
        const sortedData = [...data].sort((a, b) => new Date(b.week) - new Date(a.week));
        const latestWeek = sortedData[0];
        
        // Update title
        visualizationTitle.textContent = `Listening Trends ${currentArtist === 'all' ? 'For All Artists' : 'For ' + currentArtist}`;
        
        // Clear current list
        topSongsList.innerHTML = '';
        
        // Add top 10 songs from the latest week
        latestWeek.songs.slice(0, 10).forEach((song, index) => {
            const li = document.createElement('li');
            li.className = 'song-card';
            li.innerHTML = `
                <div><span class="song-rank">${parseInt(song.rank) + 1}</span></div>
                <div class="song-title">${song.song}</div>
                <div class="song-artist">by ${song.artist}</div>
                <div class="song-streams">${song.streams} streams</div>
            `;
            topSongsList.appendChild(li);
        });
    }

    // Update visualization based on current selections
    function updateVisualization() {
        showLoading();
        
        setTimeout(() => {
            const aggregatedData = aggregateData();
            
            if (aggregatedData.length === 0) {
                alert("No data available for the selected filters.");
                hideLoading();
                return;
            }
            
            createTrendChart(aggregatedData);
            displayTopSongs(aggregatedData);
            
            hideLoading();
        }, 100); // Small timeout to allow loading indicator to appear
    }

    // Event listeners
    artistSelect.addEventListener('change', function() {
        currentArtist = this.value;
        updateVisualization();
    });

    timeRangeSelect.addEventListener('change', function() {
        currentTimeRange = this.value;
        updateVisualization();
    });

    metricSelect.addEventListener('change', function() {
        currentMetric = this.value;
        updateVisualization();
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        updateVisualization();
    });

    // Initialize by loading all data
    loadAllData();
});