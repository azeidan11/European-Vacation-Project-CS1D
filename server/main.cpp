#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
using namespace std;

// Struct to hold city + distance info
struct CityDistance {
    string city;
    int distance;
};

int main() {
    ifstream fin("distances.csv");
    if (!fin.is_open()) {
        cerr << "Error: Could not open distances.csv" << endl;
        return 1;
    }

    vector<CityDistance> cities;
    string line;

    // Skip header row
    getline(fin, line);

    // Read city + distance from CSV
    while (getline(fin, line)) {
        stringstream ss(line);
        string city, distStr;
        getline(ss, city, ',');
        getline(ss, distStr);

        CityDistance cd;
        cd.city = city;
        cd.distance = stoi(distStr);
        cities.push_back(cd);
    }

    fin.close();

    // Output results
    cout << "European Vacation Project - Sprint 1" << endl;
    cout << "Starting City: Berlin" << endl;
    cout << "---------------------------------" << endl;

    for (const auto& cd : cities) {
        cout << cd.city << " - " << cd.distance << " km" << endl;
    }

    return 0;
}
