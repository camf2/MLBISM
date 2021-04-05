
var margin = {top: 40, right: 20, bottom: 30, left: 30},
    width = 1300 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var chartWidth = 1200 - margin.left - margin.right;



var svg = d3.select("body").append("svg").attr("id", "top")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")");


// First Chart
var scatterplotWidth = chartWidth - 200;

var xScale = d3.scale.ordinal().rangePoints([0, scatterplotWidth]);
var yScale = d3.scale.ordinal().rangePoints([height, 0]);

var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


// Second chart
//=================
var x2 = d3.scale.ordinal().rangePoints([0, width], 1),
    y2 = {},
    dragging = {};

var line2 = d3.svg.line(),
    axis2 = d3.svg.axis().orient("left"),
    background,
    foreground;

var parallel = d3.select("body").append("svg").attr("id", "meme")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + 0 + "," + margin.top + ")");

var isSingle = true;
var isClicked = false;
var mouseCoordinates = [];

d3.csv("TeamData.csv", function(error, data) {
  // Iterate through teamRanking and finalize the order based on postseason data.
  d3.csv("SeriesPostPlusWinData.csv", function(error1, dataSeries) {
    // Include salary data
    d3.csv("SalariesData.csv", function(error2, dataSalaries) {
      // All star data
      d3.csv("TrueAllstarData.csv", function(error3, dataAllStar) {
        // Form a list of teams in an array. This is for drawing the lines
        teamList = [];
        data.forEach(function(d) {
          if (teamList.length == 0) {
            teamList.push({Team: d["Franch ID"], ColorR: d["Color R"], ColorG: d["Color G"], ColorB: d["Color B"]});
          } else {
            add = true;
            for (var x = 0; x < teamList.length; x++) {
              if (d["Franch ID"] == teamList[x].Team) {
                add = false;
              }
            }
            if (add) {
              teamList.push({Team: d["Franch ID"], ColorR: d["Color R"], ColorG: d["Color G"], ColorB: d["Color B"]});
            }
          }
        });

        // Add total number of WS wins
        // An array of 0~30 as y-axis domain
        rankingList = [];
        for (var z = 0; z < 31; z++) {
          rankingList.push(z);
        }

        // An array of years as x-axis domain
        yearList = []
        data.forEach(function(d) {
          if (yearList.length == 0) {
            yearList.push({"Year ID" : d["Year ID"]});
          } else {
            var add = true;
            yearList.forEach(function(e) {
              if (e["Year ID"] == d["Year ID"]) {
                add = false;
              }
            });
            if (add) {
              // Add to the year list
                yearList.push({"Year ID" : d["Year ID"]});
            }
          }
        });

        // teamSeasonRecords and teamSalaryByYear are dictionaries. Key: Year. Value: Array of objects with team stats
        teamSeasonRecords = {};
        teamSalaryByYear = {};
        summedTeamSalaryByYear = {};
        allStartNumByYear = {};
        for (var x = 1985; x < 2017; x++) {
          teamSeasonRecords[x.toString()] = [];
          teamSalaryByYear[x.toString()] = [];
          summedTeamSalaryByYear[x.toString()] = [];
          allStartNumByYear[x.toString()] = [];
        }

        for (var x = 1985; x < 2017; x++) {
          for (var y = 0; y < teamList.length; y++) {
            allStartNumByYear[x.toString()].push({Team: teamList[y].Team, AllStarCount: 0})
          }
        }

        console.log(dataAllStar);
        console.log(allStartNumByYear);

        dataAllStar.forEach(function(d) {
          allStarYear = allStartNumByYear[d["Year ID"]]
          for (var x = 0; x < allStarYear.length; x++) {
            if (allStarYear[x].Team == d["Franchise ID"]) {
              allStarYear[x].AllStarCount += 1;
              break;
            }
          }
        })

        console.log(allStartNumByYear);

        // This is where all the data originates from...
        // Whenver you want to add an attribute form csv into objects add it here FIRST
        data.forEach(function(d) {
          allstarNum = 0;
          for (var x = 0; x < allStartNumByYear[d["Year ID"]].length; x++) {
            if (allStartNumByYear[d["Year ID"]][x].Team == d["Franch ID"]) {
              allstarNum = allStartNumByYear[d["Year ID"]][x].AllStarCount;
              break;
            }
          }
          teamSeasonRecords[d["Year ID"]].push({Team: d["Franch ID"], Wins: d.W, ColorR: d["Color R"], ColorG: d["Color G"], ColorB: d["Color B"],
            ERA: d.ERA,
            AVG: (d.H / d.AB),
            HR: d.HR,
            E: d.E,
            Attendance: d.Attendance,
            RA: d.RA,
            SOA: d.SOA,
            HA: d.HA,
            HRA: d.HRA,
            SV: d.SV,
            SLG: (((d.H - d["2B"] - d["3B"] - d["HR"]) + (2 * d["2B"]) + (3 * d["3B"]) + (4 * d["HR"]))/ d.AB ),
            FP: d.FP,
            DP: d.DP,
            Allstar: allstarNum});
        });

        console.log(teamSeasonRecords);

        dataSalaries.forEach(function(d) {
          teamSalaryByYear[d["Year ID"]].push({Team: d["Franchise ID"], Salary: d.Salary});
        });

        for (var x = 1985; x < 2017; x++) {
          year = teamSalaryByYear[x.toString()];
          for (var y = 0; y < teamList.length; y++) {
            team = teamList[y];
            sum = 0;
            for (var z = 0; z < year.length; z++) {
              if (year[z].Team == team.Team) {
                sum += +year[z].Salary;
              }
            }
            summedTeamSalaryByYear[x.toString()].push({Team: team.Team, Payroll: sum});
          }
        }

        // Start gathering team stats here to display...
        // THEN add it again here SECOND
        teamRanking = [];
        for (var x = 1985; x < 2017; x++) {
          listOfPayrollsThisYear = summedTeamSalaryByYear[x.toString()];
          teamSeasonRecords[x.toString()].forEach(function(d) {
            correctPayroll = 0
            for (var y = 0; y < listOfPayrollsThisYear.length; y++) {
              if (d.Team == listOfPayrollsThisYear[y].Team) {
                correctPayroll = listOfPayrollsThisYear[y].Payroll;
                break;
              }
            }
            teamRanking.push({Team: d.Team, Year: x.toString(), ColorR: d.ColorR, ColorG: d.ColorG, ColorB: d.ColorB, Clicked: false, Parallel: false, CurrentOpacity: 0.15, Wins: d.Wins, Rank: 30, ERA: d.ERA, "Runs Allowed": d.RA, "K by Pitchers": d.SOA, "Hits Allowed": d.HA, "HR Allowed":d.HRA, SV: d.SV, AVG: d.AVG, HR: d.HR, SLG: d.SLG, E: d.E, "Double Plays": d.DP, "Fielding %": d.FP, Attendance: d.Attendance, Payroll: correctPayroll, "All Stars": d.Allstar});
          })
        }

        // Rank teams whose in the post season
        // DO NOT touch this part until done ranking teams
        postSeasonbyYear = {};
        for (var x = 1985; x < 2017; x++) {
          postSeasonbyYear[x.toString()] = [];
        }

        postSeasonTeamsbyYear = {};
        for (var x = 1985; x < 2017; x++) {
          postSeasonTeamsbyYear[x.toString()] = [];
        }

        dataSeries.forEach(function(d) {
          postSeasonbyYear[d["Year ID"]].push({Round: d.Round, Winner:d["Team I Dwinner"], Loser: d["Team I Dloser"], Wins: parseInt(d.W)});
        })

        for (var x = 1985; x < 2017; x++) {
          postSeason = postSeasonbyYear[x.toString()];
          if (postSeason.length >= 3) {
            // World Series
            for (var y = 0; y < postSeason.length; y++) {
              if (postSeason[y].Round == "WS") {
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == postSeason[y].Winner) {
                    teamRanking[z].Rank = 30;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == postSeason[y].Loser) {
                    teamRanking[z].Rank = 29;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
              }
            }
            // ALCS & NLCS
            csLosers = [];
            for (var y = 0; y < postSeason.length; y++) {
              if (postSeason[y].Round == "ALCS" || postSeason[y].Round == "NLCS") {
                csLosers.push(postSeason[y]);
              }
            }
            if (csLosers.length == 2) {
              if (csLosers[0].Wins > csLosers[1].Wins) {
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == csLosers[0].Loser) {
                    teamRanking[z].Rank = 28;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == csLosers[1].Loser) {
                    teamRanking[z].Rank = 27;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
              } else {
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == csLosers[1].Loser) {
                    teamRanking[z].Rank = 28;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == csLosers[0].Loser) {
                    teamRanking[z].Rank = 27;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
              }
            }
          }

          if (postSeason.length >= 7) {
            // ALDS1 & ALDS2 & NLDS1 & NLDS2
            dsLosers = []
            for (var y = 0; y < postSeason.length; y++) {
              if (postSeason[y].Round == "ALDS1" || postSeason[y].Round == "ALDS2" || postSeason[y].Round == "NLDS1" || postSeason[y].Round == "NLDS2") {
                dsLosers.push(postSeason[y]);
              }
            }
            items = [];
            dsLosers.forEach(function(d) {
              items.push([d.Loser, parseInt(d.Wins)]);
            });
            // Compare
            items.sort(function(first, second) {
              return second[1] - first[1];
            });
            for (y = 0; y < items.length; y++) {
              for (var z = 0; z < teamRanking.length; z++) {
                if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == items[y][0]) {
                  teamRanking[z].Rank = 26 - y;
                  postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                  break;
                }
              }
            }
          }
          if (postSeason.length >= 9) {
            // ALWC && NLWC
            // ALCS & NLCS
            wcLosers = [];
            for (var y = 0; y < postSeason.length; y++) {
              if (postSeason[y].Round == "ALWC" || postSeason[y].Round == "NLWC") {
                wcLosers.push(postSeason[y]);
              }
            }
            if (wcLosers.length == 2) {
              if (wcLosers[0].Wins > wcLosers[1].Wins) {
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == wcLosers[0].Loser) {
                    teamRanking[z].Rank = 22;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == wcLosers[1].Loser) {
                    teamRanking[z].Rank = 21;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
              } else {
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == wcLosers[1].Loser) {
                    teamRanking[z].Rank = 22;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
                for (var z = 0; z < teamRanking.length; z++) {
                  if (teamRanking[z].Year == x.toString() && teamRanking[z].Team == wcLosers[0].Loser) {
                    teamRanking[z].Rank = 21;
                    postSeasonTeamsbyYear[x.toString()].push(teamRanking[z]);
                    break;
                  }
                }
              }
            }
          }
        }

        regularSeasonTeams = {};
        for (var x = 1985; x < 2017; x++) {
          regularSeasonTeams[x.toString()] = [];
        }

        for (var x = 1985; x < 2017; x++) {
          teamRankingYear = teamRanking.filter(function(d) {
            return d.Year == x.toString();
          });

          teamRankingYear = teamRankingYear.filter(function(d) {
            for (var y = 0; y < postSeasonTeamsbyYear[x.toString()].length; y++) {
              if (postSeasonTeamsbyYear[x.toString()][y].Team == d.Team) {
                return false;
              }
            }
            return true;
          });

          //sort
          var items = [];

          teamRankingYear.forEach(function(d) {
            items.push([d.Team, parseInt(d.Wins)]);
          });

          // Compare
          items.sort(function(first, second) {
            return second[1] - first[1];
          });
          for (var y = 0; y < items.length; y++) {
            regularSeasonTeams[x.toString()].push({Team: items[y][0], Wins: items[y][1], Rank: (30 - postSeasonTeamsbyYear[x.toString()].length - y)})
          }
        }

        for (var x = 1985; x < 2017; x++) {
          regularSeasonTeams[x.toString()].forEach(function(d) {
            for (var y = 0; y < teamRanking.length; y++) {
              if (teamRanking[y].Year == x.toString() && teamRanking[y].Team == d.Team) {
                teamRanking[y].Rank = d.Rank;
                break;
              }
            }
          });
        }
        // Done ranking teams here

        // Sum up all team sortable stats
        for (var x = 0; x < teamList.length; x++) {
          wsWins = 0;
          totalWins = 0;
          totalPayroll = 0;
          yearCount = 0;
          for (var y = 0; y < teamRanking.length; y++) {
            if (teamList[x].Team == teamRanking[y].Team && teamRanking[y].Rank == 30) {
              wsWins += 1;
            }
            if (teamList[x].Team == teamRanking[y].Team) {
              yearCount += 1;
              totalWins = totalWins + parseInt(teamRanking[y].Wins);
              totalPayroll = totalPayroll + parseInt(teamRanking[y].Payroll);
            }
          }
          teamList[x].TotalWins = totalWins;
          teamList[x].WSWins = wsWins;
          teamList[x].TotalPayroll = totalPayroll;
          teamList[x].AverageWins = totalWins / yearCount

          playoffAppearanceCount = 0;
          for (var y = 1995; y < 2017; y++) {
            iteratingTeam = postSeasonTeamsbyYear[y.toString()];
            for (var z = 0; z < iteratingTeam.length; z++) {
              if (teamList[x].Team == iteratingTeam[z].Team) {
                playoffAppearanceCount += 1;
              }
            }
          }
          teamList[x].TotalPlayoffAppearance = playoffAppearanceCount;
        }

        // set the doamin for x and y axis
        xScale.domain(yearList.map(function(d) { return d["Year ID"]; }));
        yScale.domain(rankingList);

        // adding x axis to the bottom of chart
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + 20 + "," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", chartWidth/2)
            .attr("y", 30)
            .style("text-anchor", "end")
            .text("Year");

        // adding y axi to the left of the chart
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + 10 + "," + 0 + ")")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", -20)
            .attr("y", 4)
            .style("text-anchor", "end")

        svg.append("text")
            .text("WS")
            .attr("x", -30)
            .attr("y", 4);

        svg.append("text")
            .text("WS")
            .attr("x", -30)
            .attr("y", 18);

        svg.append("text")
            .text("CS")
            .attr("x", -30)
            .attr("y", 32);

        svg.append("text")
            .text("CS")
            .attr("x", -30)
            .attr("y", 47);

        svg.append("text")
            .text("DS")
            .attr("x", -30)
            .attr("y", 61);

        svg.append("text")
            .text("DS")
            .attr("x", -30)
            .attr("y", 75);

        svg.append("text")
            .text("DS")
            .attr("x", -30)
            .attr("y", 90);

        svg.append("text")
            .text("DS")
            .attr("x", -30)
            .attr("y", 104);

        svg.append("text")
            .text("WC")
            .attr("x", -30)
            .attr("y", 118);

        svg.append("text")
            .text("WC")
            .attr("x", -30)
            .attr("y", 133);

        svg.append("rect")
          .attr("x", 10)
          .attr("y", -10)
          .attr("width", 270)
          .attr("height", 60)
          .style("fill", "blue")
          .style("opacity", 0.06)

        svg.append("rect")
          .attr("x", 280)
          .attr("y", -10)
          .attr("width", 550)
          .attr("height", 118)
          .style("fill", "blue")
          .style("opacity", 0.06)

        svg.append("rect")
          .attr("x", 830)
          .attr("y", -10)
          .attr("width", 150)
          .attr("height", 146)
          .style("fill", "blue")
          .style("opacity", 0.06)



        // Coordinates that will be used to draw the lines
        teamCoordinates = {};
        for (var x = 0; x < teamList.length; x++) {
          teamCoordinates[teamList[x].Team] = [];
        }

        // Draw Dots
        svg.append("g")
          .selectAll(".dot")
          .data(teamRanking)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("transform", "translate(" + 20 + "," + 0 + ")")
          .attr("r", 7)
          .attr("cx", function(d) {
            teamCoordinates[d.Team].push({Year: d.Year, XC: xScale(d.Year), YC: yScale(d.Rank), ColorR: d.ColorR, ColorG: d.ColorG, ColorB: d.ColorB, Clicked: d.Clicked, Parallel: d.Parallel, Wins: d.Wins});
            return xScale(d.Year);
          })
          .attr("cy", function(d) {
            return yScale(d.Rank);
          })
          .style("fill", function(d) { return d3.rgb(d.ColorR, d.ColorG , d.ColorB) })
          .style("stroke", function(d) { return d3.rgb(d.ColorR, d.ColorG , d.ColorB) })
          .style("opacity", 0.15)
          .on("mouseover", function(d) {
              tooltip.transition()
                   .duration(200)
                   .style("opacity", .9);
              tooltip.html(d.Year + " " + d.Team + "<br/> " + "Wins: " + d.Wins)
                   .style("left", (d3.event.pageX + 5) + "px")
                   .style("top", (d3.event.pageY - 20) + "px");

              svg.selectAll("line")
              .transition(500)
              .style("opacity", function(e) {
                if (d.Clicked) {
                  if (e.Clicked) {
                    if (d.Team == e.Team) {
                      return 1;
                    } else {
                      return 0.1;
                    }
                  } else {
                    return e.CurrentOpacity;
                  }
                } else {
                  return e.CurrentOpacity;
                }
              });

              svg.selectAll(".dot")
              .transition(500)
              .style("opacity", function(e) {
                if (d.Clicked) {
                  if (e.Clicked) {
                    if (d.Team == e.Team) {
                      return 1;
                    } else {
                      return 0.1;
                    }
                  } else {
                    return e.CurrentOpacity;
                  }
                } else {
                  return e.CurrentOpacity;
                }
              });
          })
          .on("mouseout", function(d) {
              tooltip.transition()
                   .duration(500)
                   .style("opacity", 0);

              svg.selectAll("line")
              .transition(500)
              .style("opacity", function(e) {
                if (e.Clicked) {
                  e.CurrentOpacity = 1;
                  return 1;
                } else {
                  e.CurrentOpacity = 0;
                  return 0;
                }
              });

              svg.selectAll(".dot")
              .transition(500)
              .style("opacity", function(e) {
                if (e.Clicked | e.Parallel) {
                  e.CurrentOpacity = 1;
                  return 1;
                } else {
                  e.CurrentOpacity = 0.15;
                  return 0.15;
                }
              });
          })
          .on("click", function(d) {
              if (d.Parallel) {
                  d.Parallel = false;
              } else {
                  d.Parallel = true;
              }
              if (isSingle) {

                background
                  .transition(500)
                  .style("opacity", function(e) {
                    if (e.Parallel) {
                        return 1
                    } else {
                        return 0
                    }
                });

                foreground
                  .transition(500)
                  .style("opacity", function(e) {
                    if (e.Parallel) {
                        return 1
                    } else {
                        return 0
                    }
                });

                svg.selectAll(".dot")
                    .style("opacity", function(e) {
                        if (e.Parallel) {
                            return 1
                        } else {
                            return 0.15
                        }
                    });

                  parallel.selectAll("path")
                      .style("pointer-events", function(e) {
                          if (e.Parallel) {
                              return "auto"
                          } else {
                              return "none"
                          }
                      });
              } else if (isClicked) {
                  mouseCoordinates.push({xcoordinate: xScale(d.Year), ycoordinate: yScale(d.Rank)});
                  var xDirection = mouseCoordinates[0].xcoordinate - mouseCoordinates[1].xcoordinate;
                  var yDirection = mouseCoordinates[0].ycoordinate - mouseCoordinates[1].ycoordinate;

                  svg.selectAll(".dot")
                      .style("opacity", function(e) {
                          if (xDirection < 0) {
                              if (xScale(e.Year) >= mouseCoordinates[0].xcoordinate & xScale(e.Year) <= mouseCoordinates[1].xcoordinate) {
                                  if (yDirection < 0) {
                                      if (yScale(e.Rank) >= mouseCoordinates[0].ycoordinate & yScale(e.Rank) <= mouseCoordinates[1].ycoordinate) {
                                          e.Parallel = true;
                                      }
                                  } else {
                                      if (yScale(e.Rank) <= mouseCoordinates[0].ycoordinate & yScale(e.Rank) >= mouseCoordinates[1].ycoordinate) {
                                          e.Parallel = true;
                                      }
                                  }

                              }
                          } else {
                              if (xScale(e.Year) <= mouseCoordinates[0].xcoordinate & xScale(e.Year) >= mouseCoordinates[1].xcoordinate) {
                                  if (yDirection < 0) {
                                      if (yScale(e.Rank) >= mouseCoordinates[0].ycoordinate & yScale(e.Rank) <= mouseCoordinates[1].ycoordinate) {
                                          e.Parallel = true;
                                      }
                                  } else {
                                      if (yScale(e.Rank) <= mouseCoordinates[0].ycoordinate & yScale(e.Rank) >= mouseCoordinates[1].ycoordinate) {
                                          e.Parallel = true;
                                      }
                                  }
                              }
                          }
                          if (e.Parallel) {
                              return 1
                          } else {
                              return 0.15
                          }
                  });

                  background
                    .transition(500)
                    .style("opacity", function(e) {
                      if (e.Parallel) {
                          return 1
                      } else {
                          return 0
                      }
                  });

                  foreground
                    .transition(500)
                    .style("opacity", function(e) {
                      if (e.Parallel) {
                          return 1
                      } else {
                          return 0
                      }
                  });

                  parallel.selectAll("path")
                      .style("pointer-events", function(e) {
                          if (e.Parallel) {
                              return "auto"
                          } else {
                              return "none"
                          }
                      });

                  mouseCoordinates = [];
                  isClicked = false;
              } else {
                  isClicked = true;
                  svg.selectAll(".dot")
                      .style("opacity", function(e) {
                          if (e.Parallel) {
                              return 1
                          } else {
                              return 0.15
                          }
                  });
                  mouseCoordinates.push({xcoordinate: xScale(d.Year), ycoordinate: yScale(d.Rank)})
              }
          });

        drawingLines = [];
        for (var x = 0; x < teamList.length; x++) {
          team = teamCoordinates[teamList[x].Team];
          for (var z = 0; z < team.length; z++) {
            if (team[z].Year != 2016) {
              drawingLines.push({Year: team[z].Year, Wins: team[z].Wins, Team: teamList[x].Team, X1: team[z].XC + 20, Y1:team[z].YC , X2: team[z+1].XC + 20, Y2: team[z+1].YC, ColorR: team[z].ColorR, ColorG: team[z].ColorG, ColorB:team[z].ColorB, Clicked: team[z].Clicked, CurrentOpacity: 0});
            }
          }
        }

        // Draw lines
        svg.append("g")
          .attr("class", "line")
          .selectAll("line")
          .data(drawingLines)
          .enter()
          .append("line")
          .attr("x1", function(d) { return d.X1 })
          .attr("y1", function(d) { return d.Y1 })
          .attr("x2", function(d) { return d.X2 })
          .attr("y2", function(d) { return d.Y2 })
          .attr("stroke-width", 2)
          .attr("stroke", function(d) { return d3.rgb(d.ColorR, d.ColorG, d.ColorB)})
          .style("opacity", 0.0);

        // Reset Button for Graph 1
        svg.append("rect")
          .attr("transform", "translate(" + -120 + "," + 440 + ")")
          .attr("x", 1120)
          .attr("y", 0)
          .attr("width", 100)
          .attr("height", height/30)
          .attr("fill", "black")
          .on("click", function(d) {
            teamRanking.forEach(function(e) {
              e.Clicked = false;
            });

            drawingTeamList.forEach(function(e) {
              e.Clicked = false;
            });

            drawingLines.forEach(function(e) {
              e.Clicked = false;
            });

            svg.selectAll(".dot")
              .transition(500)
              .style("opacity", function(e) {
                if (e.Parallel) {
                  return 1
                } else {
                  return 0.15
                }
              });

            svg.selectAll("line")
              .transition(500)
              .style("opacity", function(e) {
                return 0
              });

            svg.selectAll("rect")
              .style("stroke", function(e) {
                return "none"
              })
              .style("stroke-width", 3);
          })

        svg.append("text")
          .attr("class", "teamText")
          .attr("transform", "translate(" + -120 + "," + 440 + ")")
          .attr("x", 1140)
          .attr("y", (height / 30 / 2))
          .attr("dy", ".45em")
          .text("Reset Teams")
          .attr("fill", function(d) { return d3.rgb(255, 255, 255)});

        // Reset Button for Graph 2
        svg.append("rect")
          .attr("transform", "translate(" + 0 + "," + 440 + ")")
          .attr("x", 1120)
          .attr("y", 0)
          .attr("width", 100)
          .attr("height", height/30)
          .attr("fill", "black")
          .on("click", function(d) {
            svg.selectAll(".dot")
              .transition(500)
              .style("opacity", function(e) {
                e.Parallel = false;
                if (e.Clicked) {
                  return 1;
                } else {
                  return 0.15;
                }
              });

            background
              .transition(500)
              .style("opacity", function(e) {
                if (e.Parallel) {
                    return 1
                } else {
                    return 0
                }
            });

            foreground
              .transition(500)
              .style("opacity", function(e) {
                if (e.Parallel) {
                    return 1
                } else {
                    return 0
                }
            });
          });

        svg.append("text")
          .attr("class", "teamText")
          .attr("transform", "translate(" + 0 + "," + 440 + ")")
          .attr("x", 1140)
          .attr("y", (height / 30 / 2))
          .attr("dy", ".35em")
          .text("Reset Dots")
          .attr("fill", function(d) { return d3.rgb(255, 255, 255)});


        drawingTeamList = sortTeamRects("WSWins");
        //sortTeamRects("TotalWins");

        svg.append("g")
          .append('text')
          .attr("x", 1120)
          .attr("y", -25)
          .text("Sort by:");

        sortTeamSelections = [{Texts: "Total WS Wins", SelectT: "WSWins"}, {Texts: "Total Wins", SelectT: "TotalWins"}, {Texts: "Total Payroll", SelectT: "TotalPayroll"}, {Texts: "Average Wins", SelectT: "AverageWins"}, {Texts: "Postseasons", SelectT: "TotalPlayoffAppearance"}];
        var sortable = svg.append("g")
          .selectAll("rect")
          .data(sortTeamSelections)
          .enter()
          .append("rect")
          .attr("transform", "translate(" + 0 + "," + -20 + ")")
          .attr("x", 1120)
          .attr("y", function(d, i) {
            return i * 16;
          })
          .attr("width", 100)
          .attr("height", height/30)
          .attr("fill", function(e) {
              if (e.Texts == "Total WS Wins") {
                  return "red";
              } else {
                  return "black";
              }
          })
          .on("click", function(e) {
            // Sort team boxes
            teamBoxes.transition()
            .duration(700)
            .attr("y", function(d) {
              newTeamListYo = sortTeamRects(e.SelectT);
              for (var x = 0; x < newTeamListYo.length; x++) {
                if (newTeamListYo[x].Team == d.Team) {
                  return x * 16;
                }
              }
            });
            // Sort team texts
            teamTexts.transition()
            .duration(700)
            .attr("y", function(d) {
              newTeamListYo = sortTeamRects(e.SelectT);
              for (var x = 0; x < newTeamListYo.length; x++) {
                if (newTeamListYo[x].Team == d.Team) {
                  return x * 16 + (height / 30 / 2)
                }
              }
            });
            var toCompare = this;
            sortable[0].forEach(function(d) {
                if (toCompare == d) {
                    d.style.fill = "red";
                } else {
                    d.style.fill = "black";
                }
            });
          })

        // Draw text in the selection box
        svg.append("g")
          .selectAll("text")
          .data(sortTeamSelections)
          .enter()
          .append("text")
          .attr("class", "teamText")
          .attr("transform", "translate(" + 0 + "," + -20 + ")")
          .attr("x", 1130)
          .attr("y", function(d, i) {
            return i * 16 + (height / 30 / 2)
          })
          .attr("dy", ".35em")
          .text(function(d) { return d.Texts; })
          .attr("fill", function(d) { return d3.rgb(255, 255, 255)});

        // Draw team boxes
        var teamBoxes = svg.append("g")
          .selectAll("rect")
          .data(drawingTeamList)
          .enter()
          .append("rect")
          .attr("transform", "translate(" + 0 + "," + -40 + ")")
          .attr("x", 1000)
          .attr("y", function(d, i) {
            return i * 16;
          })
          .attr("width", 100)
          .attr("height", height/30)
          .attr("fill", function(d) { return d3.rgb(d.ColorR, d.ColorG, d.ColorB)})
          .on("click", function(d) {
            teamRanking.forEach(function(e1) {
              if (e1.Team == d.Team) {
                if (e1.Clicked == false) {
                  e1.Clicked = true;
                } else {
                  e1.Clicked = false;
                }
              }
            });

            drawingTeamList.forEach(function(e2) {
                if (e2.Team == d.Team) {
                  if (e2.Clicked == false) {
                    e2.Clicked = true;
                  } else {
                    e2.Clicked = false;
                  }
                }
              });

            drawingLines.forEach(function(e1) {
              if (e1.Team == d.Team) {
                if (e1.Clicked == false) {
                  e1.Clicked = true;
                } else {
                  e1.Clicked = false;
                }
              }
            });

            svg.selectAll(".dot")
              .transition(500)
              .style("opacity", function(e) {
                if (e.Clicked || e.Parallel) {
                  return 1;
                } else {
                  return 0.15;
                }
              });

            svg.selectAll("line")
              .transition(500)
              .style("opacity", function(e) {
                if (e.Clicked) {
                  e.CurrentOpacity = 1;
                  return 1;
                } else {
                  e.CurrentOpacity = 0;
                  return 0;
                }
              });

            if (this.style.stroke != "grey") {
                    this.style.stroke = "grey"
            } else {
                    this.style.stroke = "none";
            }


          });

        // Draw text in the box
        var teamTexts = svg.append("g")
          .attr("class", "teamText")
          .selectAll("text")
          .data(drawingTeamList)
          .enter()
          .append("text")
          .attr("class", "teamText")
          .attr("transform", "translate(" + 0 + "," + -40 + ")")
          .attr("x", 1040)
          .attr("y", function(d, i) {
            return i * 16 + (height / 30 / 2)
          })
          .attr("dy", ".35em")
          .text(function(d) { return d.Team; })
          .attr("fill", function(d) { return d3.rgb(255, 255, 255)});





        // Second Chart starts here
        //================================
        //make a new array for the second vis
        var parallelArray = [];
        for (var i = 0; i < teamRanking.length; i++) {
            parallelArray[i] = teamRanking[i];
        }
        //filter out what we never want to see
        var displayArray = d3.keys(parallelArray[0])
                      .filter(function(d, i) {
                        return ( d != "Team" && d != "Year" && d != "ColorB" && d != "ColorR" && d != "ColorG" && d != "CurrentOpacity" && d != "Clicked" && d != "Parallel" )
                      });

        var rowKeys = d3.keys(parallelArray[0]);
        //make an array of booleans that shows what columns will actually be shown, a mask
        var filtered = [];
        var shown = 0;
        for(var d = 0; d < rowKeys.length; d++)
        {
            if (rowKeys[d] != "Team" && rowKeys[d] != "Year" && rowKeys[d] != "ColorB" && rowKeys[d] != "ColorR" && rowKeys[d] != "ColorG" && rowKeys[d] != "CurrentOpacity" && rowKeys[d] != "Clicked" && rowKeys[d] != "Parallel" && shown < 5)
            {
                filtered[d] = true;
                shown++;
            } else if (rowKeys[d] == "Team" || rowKeys[d] == "Year" || rowKeys[d] == "ColorB" || rowKeys[d] == "ColorR" || rowKeys[d] == "ColorG" || rowKeys[d] == "CurrentOpacity" || rowKeys[d] == "Clicked" || rowKeys[d] == "Parallel")
            {
                filtered[d] = null;
            } else {
                filtered[d] = false;
            }
        }

        // will always show the Team names and the Year

        y2["Team"] = d3.scale.ordinal().domain(teamList.map(function(d) { return d.Team; })).rangePoints([0, height])
        y2["Year"] = d3.scale.ordinal().domain(yearList.map(function(d) { return d["Year ID"]; })).rangePoints([0, height])

        // get the dimensions to show based on the mask and gets data as well
        dimensions = d3.keys(parallelArray[0])
                      .filter(function(d, i) {
                        return ( filtered[i] ) && (y2[d] = d3.scale.linear().domain(d3.extent(parallelArray, function(p) { return +p[d]; })).range([height, 0]));
                      });

          //dynamically add checkboxes to the webpage
          var checkboxes = document.getElementById("categories[]");
          for (var i = 0; i < displayArray.length; i++) {
              var boxes = document.createElement('input');
              checkboxes.appendChild(boxes);
              var x = displayArray[i];
              boxes.value = displayArray[i];
              boxes.name = displayArray[i];
              boxes.type = "checkbox";
              boxes.id = "cat" + i;
              checkboxes.appendChild(document.createTextNode(x));
              //document.write("\n");
              var br = document.createElement("br");
              document.getElementById("categories[]").appendChild(br);

          }
          var updateChanges = document.createElement('button');
          checkboxes.appendChild(updateChanges);
          updateChanges.type = "button";
          updateChanges.id = "updateButton";
          updateChanges.value = "Update";
          updateChanges.innerHTML = "Update";
          document.getElementById("categories[]").style.marginLeft = "1150px";
          document.getElementById("categories[]").style.marginTop = "-900px";
          document.getElementById("updateButton").className = "btn btn-default";

          updateChanges.onclick = function() { // when update is clicked, change the filter array
              for(var i = 0; i < displayArray.length; i++)
              {

                  if(document.getElementById('cat'+i).checked	)
                  {
                      filtered[i + 8] = true;
                  } else { filtered[i + 8] = false; }
              }
              updateData(); // update the graph
          };

        dimensions.unshift("Year");
        dimensions.unshift("Team");
        x2.domain(dimensions);

        // Add grey background lines
        background = parallel.append("g")
          .attr("class", "background")
          .selectAll("path")
          .data(parallelArray)
          .enter().append("path")
          .attr("d", path)
          .style("opacity",0);

        // Add foreground lines based on team color
        foreground = parallel.append("g")
          .attr("class", "foreground")
          .selectAll("path")
          .data(parallelArray)
          .enter().append("path")
          .attr("d", path)
          .style("opacity",0)
          .style("stroke", function(e) {
              return d3.rgb(e.ColorR, e.ColorG, e.ColorB)
          })
          .style("stroke-width",3)
          .style("pointer-events", "none")
          .on("mouseover", function(e) { // when mouseover the lines, displays the team name and wins
              if (e.Parallel) {
                  tooltip.style("opacity", 1);
                  tooltip.html(e.Year + " " + e.Team + "<br/> " + "Wins: " + e.Wins)
                       .style("left", (d3.event.pageX + 5) + "px")
                       .style("top", (d3.event.pageY - 20) + "px");
              }
          })
          .on("mouseout", function(e) {
              tooltip.style("opacity", 0);
          });


        // Add a group element for each dimension
        var dimens = parallel.selectAll(".dimension")
          .data(dimensions)
          .enter().append("g")
          .attr("class", "dimension")
          .attr("transform", function(d) { return "translate(" + x2(d) + ")"; })

        // Add an axis and title
        dimens.append("g")
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axis2.scale(y2[d])); })
          .append("text")
          .style("text-anchor", "middle")
          .attr("y", -9)
          .text(function(d) { return d; });

        // Add and store a brush for each axis for filtering
        dimens.append("g")
          .attr("class", "brush")
          .each(function(d) { d3.select(this).call(y2[d].brush = d3.svg.brush().y(y2[d]).on("brushstart", brushstart).on("brush", brush)); })
          .selectAll("rect")
          .attr("x", -8)
          .attr("width", 16);


        function position(d) {
          var v = dragging[d];
          return v == null ? x2(d) : v;
        }

        function transition(g) {
          return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
          return line2(dimensions.map(function(p) { return [position(p), y2[p](d[p])]; }));
        }

        function brushstart() {
          d3.event.sourceEvent.stopPropagation();
        }

        // Sorts the team text boxes
        function sortTeamRects(sortBy) {
          var sortingItems = [];

          teamList.forEach(function(d) {
            sortingItems.push([d.Team, parseInt(d[sortBy]), d.ColorR, d.ColorG, d.ColorB]);
          });

          // Compare
          sortingItems.sort(function(first, second) {
            return second[1] - first[1];
          });

          newteamList = [];

          if (sortBy == "WSWins") {
            for (var x = 0; x < sortingItems.length; x++) {
              newteamList.push({Team: sortingItems[x][0], WSWins: sortingItems[x][1], ColorR: sortingItems[x][2], ColorG: sortingItems[x][3], ColorB: sortingItems[x][4], Clicked: false})
            }
          } else if (sortBy == "TotalWins") {
            for (var x = 0; x < sortingItems.length; x++) {
              newteamList.push({Team: sortingItems[x][0], TotalWins: sortingItems[x][1], ColorR: sortingItems[x][2], ColorG: sortingItems[x][3], ColorB: sortingItems[x][4], Clicked: false})
            }
          } else if (sortBy == "TotalPayroll") {
            for (var x = 0; x < sortingItems.length; x++) {
              newteamList.push({Team: sortingItems[x][0], TotalPayroll: sortingItems[x][1], ColorR: sortingItems[x][2], ColorG: sortingItems[x][3], ColorB: sortingItems[x][4], Clicked: false})
            }
          } else if (sortBy == "AverageWins") {
            for (var x = 0; x < sortingItems.length; x++) {
              newteamList.push({Team: sortingItems[x][0], AverageWins: sortingItems[x][1], ColorR: sortingItems[x][2], ColorG: sortingItems[x][3], ColorB: sortingItems[x][4], Clicked: false})
            }
          } else if (sortBy == "TotalPlayoffAppearance") {
            for (var x = 0; x < sortingItems.length; x++) {
              newteamList.push({Team: sortingItems[x][0], TotalPlayoffAppearance: sortingItems[x][1], ColorR: sortingItems[x][2], ColorG: sortingItems[x][3], ColorB: sortingItems[x][4], Clicked: false})
            }
          }

          return newteamList;
        }
        // updates the parallel coordinates (just removes then redoes everything else)
        function updateData() {
          parallel.remove();
          parallel = d3.select("body").select("#meme")
               .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                 .append("g")
              .attr("transform", "translate(" + 0 + "," + margin.top + ")");

          var parallelArray = [];
          for (var i = 0; i < teamRanking.length; i++) {
              parallelArray[i] = teamRanking[i];
          }
          var displayArray = d3.keys(parallelArray[0])
                        .filter(function(d, i) {
                          return ( d != "Team" && d != "Year" && d != "ColorB" && d != "ColorR" && d != "ColorG" && d != "CurrentOpacity" && d != "Clicked" && d != "Parallel" )
                        });

          var rowKeys = d3.keys(parallelArray[0]);

          // very clever code here
          // Confirmed that it works
          y2["Team"] = d3.scale.ordinal().domain(teamList.map(function(d) { return d.Team; })).rangePoints([0, height])
          y2["Year"] = d3.scale.ordinal().domain(yearList.map(function(d) { return d["Year ID"]; })).rangePoints([0, height])

          dimensions = d3.keys(parallelArray[0])
                        .filter(function(d, i) {
                          return ( filtered[i] ) && (y2[d] = d3.scale.linear().domain(d3.extent(parallelArray, function(p) { return +p[d]; })).range([height, 0]));
                        });

          dimensions.unshift("Year");
          dimensions.unshift("Team");
          x2.domain(dimensions);

          // Add grey background lines for context.
          background = parallel.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(parallelArray)
            .enter().append("path")
            .attr("d", path)
            .style("opacity", function(e) {
                if (e.Parallel) {
                    return 1
                } else {
                    return 0
                }
            });

          // Add blue foreground lines for focus.
          foreground = parallel.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(parallelArray)
            .enter().append("path")
            .attr("d", path)
            .style("opacity", function(e) {
                if (e.Parallel) {
                    return 1
                } else {
                    return 0
                }
            })
            .style("stroke", function(e) {
                return d3.rgb(e.ColorR, e.ColorG, e.ColorB)
            })
            .on("mouseover", function(e) {
                if (e.Parallel) {
                    tooltip.style("opacity", 1);
                    tooltip.html(e.Year + " " + e.Team + "<br/> " + "Wins: " + e.Wins)
                         .style("left", (d3.event.pageX + 5) + "px")
                         .style("top", (d3.event.pageY - 20) + "px");
                }
            })
            .on("mouseout", function(e) {
                tooltip.style("opacity", 0);
            });

          // Add a group element for each dimension
          var dimens = parallel.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x2(d) + ")"; })


          // Add an axis and title.
          dimens.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis2.scale(y2[d])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; });

          // Add and store a brush for each axis for filtering data
          dimens.append("g")
            .attr("class", "brush")
            .each(function(d) { d3.select(this).call(y2[d].brush = d3.svg.brush().y(y2[d]).on("brushstart", brushstart).on("brush", brush)); })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
          var actives = dimensions.filter(function(p) { return !y2[p].brush.empty(); }),
              extents = actives.map(function(p) { return y2[p].brush.extent(); });
          foreground.style("display", function(d) {
            return actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
          });
        }
      });
    });
  });
});

function multi() {
    isSingle = false;
}
function single() {
    isSingle = true;
}
