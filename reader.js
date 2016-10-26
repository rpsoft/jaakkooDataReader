// Make sure we got a filename on the command line.
// if (process.argv.length < 3) {
//   console.log('Usage: node ' + process.argv[1] + ' FILENAME');
//   process.exit(1);
// }
// // Read the file and print its contents.
// // var fs = require('fs')
// //   , filename = process.argv[2];
// // fs.readFile(filename, 'utf8', function(err, data) {
// //   if (err) throw err;
// //   //console.log('OK: ' + filename);
// //   data = JSON.parse(data)
// //   // for ( var a in data) {
// //   //   console.log(data[a])
// //   //   break;
// //   // }
// //
// // });
//
// var fs = require('fs');
// var readline = require('readline');
// var stream = require('stream');
//
// var instream = fs.createReadStream(process.argv[2]);
// var outstream = new stream;
// var rl = readline.createInterface(instream, outstream);
//
// var data = "";
//
// rl.on('line', function(line) {
//   data = data+line
// });
//
// rl.on('close', function() {
//   //var otherthing = JSON.parse(data)
//   console.log (data.substring(1056680,1056687))
// });


encode = (s) => {
  return new Buffer(s).toString('base64')
}

var data = require("./lastLineFullData.json")
//console.log(data)
debugger;

console.log("\ncreator,task,title,description")

for (var task in data['task']['taskList']){
  var d = data['task']['taskList'][task];
  for( var p in d){
     console.log(encode(d[p].creator)+","+task+",\""+d[p].title.trim()+"\",\""+d[p].description.trim()+"\"")
 }
}

var accounts = data['accounts']



console.log("\ncreator,task,docId,similarTo,title,description")
for (var task in data['task']['similarList']){
  var d = data['task']['similarList'][task];
  for( var p in d){
    for( var s in d[p].similarTo ){
      console.log( encode(d[p].creator)+","+task+",\""+d[p].id+"\",\""+d[p].similarTo[s]+",\""+d[p].title.trim()+"\",\""+d[p].description.trim()+"\"")
    }
  }
}

//Individual Ratings.
console.log("\ncreator,task,title,description,1star,2star,3star,4star,5star")
for (var task in data['task']['favouritList']){
  var d = data['task']['favouritList'][task];
  for( var p in d){
    console.log(encode(d[p].creator)+","+task+",\""+d[p].title.trim()+"\",\""+d[p].description.trim()+"\","+d[p].rating)
  }
}



processIncomingData = (data, accounts) =>{


        if( data == null ){
          return
        }

        var results = data.reduce(
          (prev, current) => {
                let account = accounts[current.creator]
                if (!account){
                  return prev
                }
                var currentEntry = { account : {email: current.creator, firstname: account.firstName, surname: account.surname }, stars: [0,0,0,0,0], lastTimeSubmitted: current.timeSubmitted }
                var index = (current.rating[0] || 0) -1
                if ( index > -1 )
                    currentEntry.stars[index] = 1;
                    var isThereIndex = prev.findIndex( (element, index, array)=>{ return element.account.email == currentEntry.account.email})
                if ( isThereIndex > -1 ){

                    for ( var i in currentEntry.stars ){
                      prev[isThereIndex].stars[i] = prev[isThereIndex].stars[i] + currentEntry.stars[i]
                    }

                    if ( prev[isThereIndex].lastTimeSubmitted < currentEntry.lastTimeSubmitted ){
                        prev[isThereIndex].lastTimeSubmitted = currentEntry.lastTimeSubmitted;
                    }

                } else {
                  prev.push(currentEntry);
                }
                return prev;
          },
          []
        );

        var data = results;
        computeRanking(data);



        data.sort(function(a, b){
          if ( b.score-a.score == 0){
            if ( b.stars[4]-a.stars[4] == 0){
              if ( b.stars[3]-a.stars[3] == 0){
                if ( b.stars[2]-a.stars[2] == 0){
                  if ( b.stars[1]-a.stars[1] == 0){
                    if ( b.stars[0]-a.stars[0] == 0){
                      return a.lastTimeSubmitted - b.lastTimeSubmitted;
                    }else { return b.stars[0]-a.stars[0] }
                  } else { return b.stars[1]-a.stars[1] }
                } else { return b.stars[2]-a.stars[2] }
              } else { return b.stars[3]-a.stars[3] }
            } else { return b.stars[4]-a.stars[4] }
          } else { return b.score-a.score }
        });

        data.map((item,i) => {item.rank = (i+1); item.pay = getPay(i+1);});

      return data;
  }

  getPay = (i) => {
    switch (i) {
      case 1:
        return 5;
      case 2:
        return 2;
      case 3:
        return 1;
      case 4:
        return 0.5;
      case 5:
        return 0;
      default:
        return 0;
    }
  }

  // Function to compute the ranking of each participant and add to the object.
  computeRanking = (data) =>{
    data.map( (participant) => {participant.score = computeStarScore(participant.stars)});


  }

  computeStarScore = (stars) => {
    var totalScore = 0;
    for ( var i = 0; i < stars.length; i++){
      totalScore +=  (i+1)*stars[i];
    }
    return totalScore
  }


console.log("\ncreator,group,grouptype,task,score,pay")
var accounts = data['accounts']

for ( var g in data['groups']){
  var groupAccounts = {}
  var grouptype = data['groups'][g].type
  for ( var a in data['groups'][g].accountList){
    var email = data['groups'][g].accountList[a]
    groupAccounts[email] = accounts[email];
    //groupAccounts[email].group = data['groups'][g].type

  }

  for (var task in data['task']['favouritList']){
      var d = data['task']['favouritList'][task];
      var rankData = processIncomingData(d,groupAccounts)
      for ( var e in rankData){
        console.log(encode(rankData[e].account.email)+","+g+","+grouptype+","+task+","+rankData[e].score+","+rankData[e].pay)
      }
      //break;
  }

}
