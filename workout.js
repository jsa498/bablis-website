document.addEventListener('DOMContentLoaded', () => {
    const workoutLog = document.getElementById('workout-log');
    const daySelector = document.getElementById('day');
    const userButtons = document.querySelectorAll('.user-button');
    let currentUser = 'Mottu';

    const exercises = {
        Monday: ['Chest Press', 'Incline Dumbbell Press', 'Lateral Raises', 'Bicep Curls'],
        Wednesday: ['Hip Adductor Curls', 'Hip Inductor Curls', 'Seated Hamstring Curls', 'RDL’s (Romanian Deadlifts)', 'Leg Extensions', 'Squats'],
        Thursday: ['Lat Pullovers', 'Lat Pulldowns', 'Rows', 'Tricep Pushdowns', 'Dips', 'Rear Delt Flies'],
        Saturday: ['Glute Extensions', 'Hip Thrusts', 'Calf Raises', 'Sumo Squats']
    };

    userButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentUser = button.id.charAt(0).toUpperCase() + button.id.slice(1);
            userButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            displayExercises(daySelector.value);
        });
    });

    daySelector.addEventListener('change', (event) => {
        const selectedDay = event.target.value;
        displayExercises(selectedDay);
    });

    displayExercises(daySelector.value);

    function displayExercises(day) {
        workoutLog.innerHTML = `<h2>${day}'s Workout for ${currentUser}</h2>`;
        if (exercises[day]) {
            exercises[day].forEach(exercise => {
                const accordion = document.createElement('button');
                accordion.classList.add('accordion');
                accordion.textContent = exercise;
                workoutLog.appendChild(accordion);

                const panel = document.createElement('div');
                panel.classList.add('panel');
                panel.innerHTML = `
                    <form data-exercise="${exercise}">
                        <input type="text" name="warmup" placeholder="Warm-up sets">
                        <input type="number" name="weight" placeholder="Weight (lbs)">
                        <input type="number" name="reps" placeholder="Reps">
                        <input type="text" name="goal" placeholder="Goal">
                        <button type="submit">Log Set</button>
                    </form>
                    <div class="set-entries"></div>
                `;
                workoutLog.appendChild(panel);

                accordion.addEventListener('click', () => {
                    accordion.classList.toggle('active');
                    if (panel.style.display === 'block') {
                        panel.style.display = 'none';
                    } else {
                        panel.style.display = 'block';
                    }
                });

                panel.querySelector('form').addEventListener('submit', (event) => {
                    event.preventDefault();
                    logSet(event.target);
                });

                displayLastSet(exercise, panel.querySelector('form'));
            });
        } else {
            workoutLog.innerHTML += '<p>No workout scheduled for today.</p>';
        }
        displayLoggedSets(day);
    }

    async function logSet(form) {
        const exercise = form.getAttribute('data-exercise');
        const warmup = form.warmup.value;
        const weight = form.weight.value;
        const reps = form.reps.value;
        const goal = form.goal.value;

        const setEntry = {
            warmup,
            weight,
            reps,
            goal,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(currentUser).collection('exercises').doc(exercise).collection('sets').add(setEntry);

        form.reset();
        displayExercises(daySelector.value);
    }

    async function displayLoggedSets(day) {
        if (exercises[day]) {
            for (const exercise of exercises[day]) {
                const panel = document.querySelector(`form[data-exercise="${exercise}"]`).nextElementSibling;
                const setEntries = panel.querySelector('.set-entries');
                setEntries.innerHTML = '';

                const querySnapshot = await db.collection('users').doc(currentUser).collection('exercises').doc(exercise).collection('sets').orderBy('timestamp').get();
                querySnapshot.forEach((doc) => {
                    const set = doc.data();
                    const setEntryDiv = document.createElement('div');
                    setEntryDiv.classList.add('set-entry');
                    setEntryDiv.innerHTML = `
                        <span>Warm-up: ${set.warmup}, Weight: ${set.weight}lbs, Reps: ${set.reps}, Goal: ${set.goal}</span>
                        <button data-exercise="${exercise}" data-id="${doc.id}">Delete</button>
                    `;
                    setEntries.appendChild(setEntryDiv);

                    setEntryDiv.querySelector('button').addEventListener('click', (event) => {
                        deleteSet(event.target.dataset.exercise, event.target.dataset.id);
                    });
                });
            }
        }
    }

    async function deleteSet(exercise, id) {
        await db.collection('users').doc(currentUser).collection('exercises').doc(exercise).collection('sets').doc(id).delete();
        displayExercises(daySelector.value);
    }

    async function displayLastSet(exercise, form) {
        const querySnapshot = await db.collection('users').doc(currentUser).collection('exercises').doc(exercise).collection('sets').orderBy('timestamp', 'desc').limit(1).get();
        if (!querySnapshot.empty) {
            const lastSet = querySnapshot.docs[0].data();
            form.warmup.value = lastSet.warmup;
            form.weight.value = lastSet.weight;
            form.reps.value = lastSet.reps;
            form.goal.value = lastSet.goal;
        }
    }
});
