
    // Function to dynamically load the Google Maps API
    async function loadGoogleMapsAPI() {
        if (typeof google !== 'undefined') return;

        const script = document.createElement('script');
        script.src = "";
        script.async = true;
        script.defer = true;

        return new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize Google Maps and Autocomplete (must be global for the callback)
    function initMap() {
        initializeAutocomplete('pickup');
        initializeAutocomplete('dropoff');
    }

    // Initialize Google Places Autocomplete for given input field
    const initializeAutocomplete = (inputId) => {
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
            new google.maps.places.Autocomplete(inputElement);
        }
    };

    // Calculate taxi fare based on distance, tariff, and additional options
    const calculateTaxiFare = (distance, tariff, airportPickup, cardPayment) => {
        const tariffs = {
            1: { flagFall: 2.90, distanceRate: 3.17, bookingFee: 1.50 },
            2: { flagFall: 4.30, distanceRate: 5.17, bookingFee: 1.50 },
            3: { flagFall: 6.30, distanceRate: 7.17, bookingFee: 1.50 }
        };

        let { flagFall, distanceRate, bookingFee } = tariffs[tariff];
        let baseFare = flagFall + (distance * distanceRate) + bookingFee;

        if (airportPickup) baseFare += 3.50; // Airport surcharge
        if (cardPayment) baseFare *= 1.10;   // 10% surcharge for card payment

        // Calculate a fare range
        const lowerFare = (baseFare * 0.9).toFixed(2);
        const upperFare = (baseFare * 1.2).toFixed(2);

        return { baseFare: baseFare.toFixed(2), lowerFare, upperFare };
    };

    // Calculate distance between pickup and dropoff using Google Distance Matrix API
    const getDistance = async (pickup, dropoff) => {
        if (!pickup || !dropoff) return Promise.reject('Locations are required');

        const service = new google.maps.DistanceMatrixService();
        const response = await new Promise((resolve, reject) => {
            service.getDistanceMatrix({
                origins: [pickup],
                destinations: [dropoff],
                travelMode: 'DRIVING',
            }, (response, status) => {
                if (status === 'OK') resolve(response);
                else reject('Error calculating distance.');
            });
        });

        const distanceInMeters = response.rows[0].elements[0].distance.value;
        return distanceInMeters / 1000;  // Convert meters to kilometers
    };

    // Function to calculate and display the fare
    const calculateFare = async () => {
        const pickup = document.getElementById('pickup').value;
        const dropoff = document.getElementById('dropoff').value;
        const tariff = document.getElementById('timeOfDay').value;
        const airportPickup = document.getElementById('airportPickup').checked;
        const cardPayment = document.getElementById('cardPayment').checked;

        try {
            const distance = await getDistance(pickup, dropoff);
            const { lowerFare, upperFare } = calculateTaxiFare(distance, tariff, airportPickup, cardPayment);

            // Display fare range
            document.getElementById('fareResult').innerText = `Estimated Fare: $${lowerFare} to $${upperFare}`;
            document.getElementById('bookNow').style.display = 'inline-block';
        } catch (error) {
            alert(error);
        }
    };

    // Redirect to booking page when "Book Now" is clicked
    const bookTaxi = () => {
        window.location.href = 'https://maxitaxisbrisbane.com.au/book-maxi-taxi/';
    };

    // Load the Google Maps API once the page is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        await loadGoogleMapsAPI();
    });
