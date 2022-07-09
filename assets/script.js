'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
  date = new Date();
  
  id = (Date.now() + '').slice(-10);
  
  constructor(coords, distance, duration){
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
    
  }
  
  _setDescription(){
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${`${this.date.getDate()}`.padStart(2,'0')}`;
    
  }
}

class Running extends Workout{

  type = 'running';
  
  constructor(coords, distance, duration, cadence){
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  
  calcPace(){
    
    this.pace = this.duration/this.distance;
    return this.pace;

  }
}
class Cycling extends Workout{
  
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain){
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed(){
    this.speed = this.distance/(this.duration/60);
    return this.speed;
  }

  
}



/////////////////////
class App{

  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor(){
    //Get user's position
    this._getPosition();

    //Fetch data from local storage

    this._getLocalStorage();

    //Attach event listeners
    form.addEventListener('submit',this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));


  }

  _getPosition(){

    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this)
      ,
      function () {
        //permission is blocked
        alert('Unable to detect your current location. \nPlease try again later.');
      }
    );
    

  }

  _loadMap(position){

    
      // console.log(position);
  
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      // console.log(latitude, longitude);
  
      const coords = [latitude, longitude];
  
       this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
  
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 100,
      }).addTo( this.#map);
  
      console.log(L.tileLayer.maxZoom);
  
     
  
      //   Handling clicks on map
      this.#map.on('click', this._showForm.bind(this));

      
    this.#workouts.forEach(work=> {
      this._renderWorkOutMarker(work);
    })
      
    
  }

  _showForm(mapE){
    this.#mapEvent = mapE;
  
          form.classList.remove('hidden');
          inputDistance.focus();

  }
  _hideForm(){
   
  
    inputCadence.value = inputElevation.value = inputDistance.value = inputDuration.value ='';
          form.classList.add('hidden');
          inputDistance.blur();
          form.style.display = 'none'; 
          setTimeout(function(){
            form.style.display = 'grid'; 
          },1000);


  }

  _toggleElevationField(e){

    
      e.preventDefault();
  
      //toggles the running/cycling form
      inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
     
  

  }

  _newWorkout(e){

    const validInput = (...inputs)=>inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(input=>input>0);
      e.preventDefault();

      //Get data from the form
  
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const type = inputType.value;
      const {lat: lati,lng: lngi} = this.#mapEvent.latlng;
      let workout;
      //Check if  data is valid?
     

        //If activity is running, create running object
        if(type === 'running'){
          const cadence = +inputCadence.value;
          if(!validInput(distance, cadence,duration) || !allPositive(distance, cadence,duration)) return alert('Inputs have to be positive numbers!');
          
           workout = new Running([lati, lngi], distance, duration, cadence);
          }
          
          //If activity is cycling, create cycling object
          
          if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if(!validInput(distance,duration,elevation)|| !allPositive(distance,duration)) return alert('Inputs have to be positive numbers!');
            workout = new Cycling([lati, lngi], distance, duration, elevation);
            
            
            
          }
          
          //Add new object to workout array
          this.#workouts.push(workout);
  
          //Render workout on map as marker
          this._renderWorkOutMarker(workout);

          this._renderWorkoutList(workout);
          //Hide form
          //clearing the inputs
          this._hideForm();
          
          
          
          //display marker

          //set local storage to all workouts
          this._setLocalStorage();
          
          
        }
        
        _renderWorkOutMarker(workout) {
          
          
          
          L.marker(workout.coords)
          .addTo(this.#map)
          .bindPopup(L.popup({
              maxWidth:200,
              minWidth:100,
              autoClose: false,
              closeOnClick:false,
              className: `${workout.type}-popup`,
              
      
          }))
          .setPopupContent(`${workout.type=== 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
          .openPopup(); 


          
  }

  _renderWorkoutList(workout) {

    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type=== 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          
          `;

          if(workout.type === 'running'){
            html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">👣</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
        </li>
            
            `;
          }

          if(workout.type==='cycling'){
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
            `
          }

          form.insertAdjacentHTML('afterend',html);

           
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');

    if(!workoutEl) return;

    const workout = this.#workouts.find( work => workoutEl.dataset.id === work.id);
    this.#map.setView(workout.coords, 13,{
      animate: true,
      pan: {
        duration: 2
      }
    });
  }

  _setLocalStorage(){
    
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    
  }
  _getLocalStorage(){

    const data = JSON.parse(localStorage.getItem('workouts')); 

    if(!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work=> {
      this._renderWorkoutList(work);
    });
    
  }

  reset(){//enter in the console to clear the localStorage
    localStorage.removeItem('workouts');
    location.reload();
  }
  

}

const app = new App();





