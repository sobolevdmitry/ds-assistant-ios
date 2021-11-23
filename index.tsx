/**
 * @format
 */

var apiUrl = "http://localhost/application/write"
var apiKey = ""
var isUpdatingNow = false
var latestStepsData = null
var latestSleepData = null
var latestWeightData = null
var latestWorkoutsData = null
var latestPosition = null
var currentPosition = null

import React, { Component } from 'react'
import {
    AppRegistry,
    NativeAppEventEmitter,
    SafeAreaView,
    ScrollView,
    Text
} from 'react-native'

import AppleHealthKit, {
    HealthValue
} from 'react-native-health'

let appComponent;
let logs = []

const log = (data) => {
    try {
        if (typeof data === 'object') {
            data = JSON.stringify(data)
        }
        logs.push(new Date().toLocaleTimeString() + ' ' + data)
        if (appComponent) {
            appComponent.updateLogs(logs)
        }
        return console.log(data)
    } finally {}
}

const postData = (entity, data): void => {
    try {
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                entity: entity,
                data: data
            })
        })
          .then((response) => response.json())
          .then((json) => {
              log(json)
          })
          .catch((error) => {
              log(error);
          })
    } finally {}
}

const updateData = (): void => {
    try {
        if (isUpdatingNow) return
        isUpdatingNow = true
        let now = new Date()
        let yesterday = new Date()
        let monthAgo = new Date()
        let yearAgo = new Date()
        yesterday.setDate(now.getDate() - 1)
        monthAgo.setDate(now.getDate() - 31)
        yearAgo.setDate(now.getDate() - 31 * 12)

        AppleHealthKit.getSleepSamples({ startDate: yesterday.toISOString() }, (error: string, results: HealthValue[]) => {
            if (results) {
                let result = results[0]
                if (result) {
                    if (latestSleepData !== result) {
                        latestSleepData = result
                        postData('sleep', result)
                    }
                }
            }
        })

        AppleHealthKit.getStepCount({}, (error: string, result: HealthValue) => {
            if (result) {
                if (latestStepsData !== result) {
                    latestStepsData = result
                    postData('steps', result)
                }
            }
        })

        // @ts-ignore
        AppleHealthKit.getLatestWeight({ unit: 'gram' }, (error: string, result: HealthValue) => {
            if (result) {
                if (latestWeightData !== result) {
                    latestWeightData = result
                    postData('weight', result)
                }
            }
        })

        // @ts-ignore
        AppleHealthKit.getSamples({
            startDate: yearAgo.toISOString(),
            endDate: now.toISOString(),
            type: 'Workout'
        }, (error: string, results: HealthValue[]) => {
            if (latestWorkoutsData !== results) {
                latestWorkoutsData = results
                postData('workouts', results)
            }
        })

        if (currentPosition !== latestPosition) {
            latestPosition = currentPosition
            postData('location', latestPosition)
        }
        isUpdatingNow = false
    } finally {}
}


try {
    AppleHealthKit.initHealthKit({
        permissions: {
            read: [
                AppleHealthKit.Constants.Permissions.SleepAnalysis,
                AppleHealthKit.Constants.Permissions.StepCount,
                AppleHealthKit.Constants.Permissions.Weight,
                AppleHealthKit.Constants.Permissions.Workout
            ],
            write: [],
        },
    }, (error: string) => {
        if (!error) {
            updateData()
        }
    })
} finally {}


try {
    const observerSetupSuccess = (): void => {}
    NativeAppEventEmitter.addListener('healthKit:StepCount:setup:success', observerSetupSuccess)
    NativeAppEventEmitter.addListener('healthKit:Workout:setup:success', observerSetupSuccess)

    const observerNewData = (): void => {
        updateData()
    }
    NativeAppEventEmitter.addListener('healthKit:StepCount:new', observerNewData)
    NativeAppEventEmitter.addListener('healthKit:Workout:new', observerNewData)
} finally {}

import Geolocation, { GeolocationError, GeolocationResponse } from '@react-native-community/geolocation'

try {
    Geolocation.watchPosition((position: GeolocationResponse): void => {
        currentPosition = position
        updateData()
    }, (error: GeolocationError): void => {}, {
        'maximumAge': (24 * 60 * 60),
        'enableHighAccuracy': true,
        'distanceFilter': 1e3,
        'useSignificantChanges': true
    })
} finally {}

class App extends Component <any, any> {
    constructor(props) {
        super(props)
        this.state = {
            logs: []
        }
    }

    updateLogs(logs) {
        this.setState({logs: logs})
    }

    componentDidMount() {
        appComponent = this
    }

    render() {
        return (
          <SafeAreaView>
              <ScrollView>
                  {this.state.logs.map((item, idx) => <Text key={idx}>{item}</Text>)}
              </ScrollView>
          </SafeAreaView>
        )
    }
}

AppRegistry.registerComponent('Assistant', () => App)
