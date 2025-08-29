// import React, { useState, useEffect } from 'react';
// import { View, Text, TouchableOpacity, Alert } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
// import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
// import UniversalSafeArea from '../components/UniversalSafeArea';
// import UniversalScrollContainer from '../components/UniversalScrollContainer';
// import styles from '../styles/EnergyDashboardStyles'; // Make sure this imports the updated styles
// import config from '../assets/config';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const translations = {
//   en: {
//     title: 'Energy Dashboard',
//     realTime: 'Real-Time Metrics',
//     production: 'Production',
//     consumption: 'Consumption',
//     gridFeed: 'Grid Feed-In',
//     batteryCharge: 'Battery Charge',
//     batteryStatus: 'Battery Status',
//     level: 'Level',
//     health: 'Health',
//     timeToFull: 'Time to Full',
//     gridStatus: 'Grid Status',
//     voltage: 'Voltage',
//     frequency: 'Frequency',
//     energyFlow: 'Energy Flow',
//     solar: 'Solar',
//     home: 'Home',
//     battery: 'Battery',
//     grid: 'Grid',
//     weather: 'Weather & Forecast',
//     solarIrradiance: 'Solar Irradiance',
//     historicalData: 'Historical Data',
//     today: 'Today',
//     week: 'Week',
//     month: 'Month',
//     carbonFootprint: 'Carbon Footprint',
//     co2Saved: 'CO₂ Saved Today',
//     totalSaved: 'Total Saved',
//     equivalentTrees: 'Equivalent Trees Planted',
//     predictions: 'Predictive Analytics',
//     nextHour: 'Next Hour Production',
//     peakTime: 'Est. Peak Time',
//     price: 'Price Prediction',
//     anomalies: 'Anomaly Score',
//     energy: 'Energy Prediction',
//     export: 'Export Summary',
//   },
//   bn: {
//     title: 'এনার্জি ড্যাশবোর্ড',
//     realTime: 'রিয়েল-টাইম মেট্রিক্স',
//     production: 'উৎপাদন',
//     consumption: 'খরচ',
//     gridFeed: 'গ্রিড ফিড-ইন',
//     batteryCharge: 'ব্যাটারি চার্জ',
//     batteryStatus: 'ব্যাটারির অবস্থা',
//     level: 'স্তর',
//     health: 'স্বাস্থ্য',
//     timeToFull: 'সম্পূর্ণ চার্জ হতে সময়',
//     gridStatus: 'গ্রিডের অবস্থা',
//     voltage: 'ভোল্টেজ',
//     frequency: 'ফ্রিকোয়েন্সি',
//     energyFlow: 'এনার্জি ফ্লো',
//     solar: 'সৌর',
//     home: 'বাসা',
//     battery: 'ব্যাটারি',
//     grid: 'গ্রিড',
//     weather: 'আবহাওয়া ও পূর্বাভাস',
//     solarIrradiance: 'সৌর বিকিরণ',
//     historicalData: 'ঐতিহাসিক ডেটা',
//     today: 'আজ',
//     week: 'সপ্তাহ',
//     month: 'মাস',
//     carbonFootprint: 'কার্বন ফুটপ্রিন্ট',
//     co2Saved: 'আজ CO₂ সংরক্ষিত',
//     totalSaved: 'মোট সংরক্ষিত',
//     equivalentTrees: 'সমতুল্য বৃক্ষরোপণ',
//     predictions: 'ভবিষ্যদ্বাণীমূলক বিশ্লেষণ',
//     nextHour: 'পরবর্তী ঘন্টার উৎপাদন',
//     peakTime: 'আনুমানিক পিক সময়',
//     price: 'মূল্য ভবিষ্যদ্বাণী',
//     anomalies: 'অস্বাভাবিকতার স্কোর',
//     energy: 'এনার্জি ভবিষ্যদ্বাণী',
//     export: 'সারাংশ এক্সপোর্ট করুন',
//   },
// };

// export default function EnergyDashboardScreen() {
//   const [language, setLanguage] = useState('en');
//   const [timeframe, setTimeframe] = useState('today');
//   const [energyData, setEnergyData] = useState(null);
//   const t = translations[language];

//   useEffect(() => {
//     fetchEnergyData();
//   }, []);

//   async function fetchEnergyData() {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(`${config.API_BASE_URL}/energy`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to fetch energy data');
//       }

//       setEnergyData(data);
//     } catch (err) {
//       console.error('Error fetching energy data:', err);
//       Alert.alert('Error', 'Failed to fetch energy data. Check your network connection.');
//     }
//   }

//   if (!energyData) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Loading energy data...</Text>
//       </View>
//     );
//   }

//   const renderMetricCard = (icon, label, value, unit, color) => (
//     <View style={styles.metricCard}>
//       <Feather name={icon} size={24} color={color || '#333'} />
//       <Text style={styles.metricLabel}>{label}</Text>
//       <Text style={styles.metricValue}>
//         {value} <Text style={styles.metricUnit}>{unit}</Text>
//       </Text>
//     </View>
//   );

//   const renderProductionChart = () => {
//     const dataArray = energyData.data.historical[timeframe] || [];
//     const maxDataValue = dataArray.length > 0 ? Math.max(...dataArray) : 1;

//     return (
//       <View style={styles.chartContainer}>
//         <Text style={styles.chartTitle}>
//           {t.production} ({t[timeframe]})
//         </Text>
//         <View style={styles.chartPlaceholder}>
//           {dataArray.length === 0 ? (
//             <Text style={styles.chartPlaceholderText}>No data available</Text>
//           ) : (
//             dataArray.map((value, index) => {
//               const barHeight = value > 0 ? (value / maxDataValue) * 150 : 1;
//               return (
//                 <View
//                   key={`${timeframe}-${index}`}
//                   style={{
//                     width: 20,
//                     height: barHeight,
//                     backgroundColor: '#4CAF50',
//                     marginHorizontal: 2,
//                     alignSelf: 'flex-end',
//                   }}
//                 />
//               );
//             })
//           )}
//         </View>
//       </View>
//     );
//   };

//   const renderEnergyFlowDiagram = () => (
//     <View style={[styles.card, styles.cardShadow]}>
//       <Text style={styles.sectionTitle}>{t.energyFlow}</Text>
//       <View style={styles.flowDiagram}>
//         <View style={styles.flowNodeContainer}>
//           <View style={styles.flowNode}>
//             <Feather name="sun" size={24} color="#FFC107" />
//             <Text style={styles.nodeText}>{t.solar}</Text>
//           </View>
//           <View style={styles.flowNode}>
//             <Feather name="home" size={24} color="#2196F3" />
//             <Text style={styles.nodeText}>{t.home}</Text>
//           </View>
//           <View style={styles.flowNode}>
//             <Feather name="battery-charging" size={24} color="#4CAF50" />
//             <Text style={styles.nodeText}>{t.battery}</Text>
//           </View>
//           <View style={styles.flowNode}>
//             <MaterialCommunityIcons name="transmission-tower" size={24} color="#F44336" />
//             <Text style={styles.nodeText}>{t.grid}</Text>
//           </View>
//         </View>
//         <Text style={styles.flowArrow}>➔</Text>
//       </View>
//     </View>
//   );

//   const renderPredictionCard = (icon, label, value, unit, color, customBorderColor) => (
//     <View
//       style={[
//         styles.predictionCard,
//         customBorderColor && { borderLeftColor: customBorderColor, borderLeftWidth: 4 }, // Apply dynamic border
//       ]}
//     >
//       <View style={styles.predictionIcon}>
//         <Feather name={icon} size={20} color={color} />
//       </View>
//       <View style={styles.predictionContent}>
//         <Text style={styles.predictionLabel}>{label}</Text>
//         <Text style={styles.predictionValue}>
//           {value} <Text style={styles.predictionUnit}>{unit}</Text>
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <UniversalSafeArea style={styles.safeArea}>
//       <StatusBar style="dark" />
//       <UniversalScrollContainer
//         style={styles.container}
//         contentContainerStyle={{ paddingBottom: 30 }}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>{t.title}</Text>
//           <TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'bn' : 'en')}>
//             <Text style={styles.langToggle}>{language === 'en' ? 'EN/BN' : 'BN/EN'}</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={[styles.card, styles.cardShadow]}>
//           <Text style={styles.sectionTitle}>{t.realTime}</Text>
//           <View style={styles.metricsGrid}>
//             {renderMetricCard(
//               'sunrise',
//               t.production,
//               energyData.data.realTimeMetrics.production,
//               'kW',
//               '#4CAF50',
//             )}
//             {renderMetricCard(
//               'zap',
//               t.consumption,
//               energyData.data.realTimeMetrics.consumption,
//               'kW',
//               '#FFC107',
//             )}
//             {renderMetricCard(
//               'chevrons-up',
//               t.gridFeed,
//               energyData.data.realTimeMetrics.gridFeedIn,
//               'kW',
//               '#2196F3',
//             )}
//             {renderMetricCard(
//               'battery-charging',
//               t.batteryCharge,
//               energyData.data.realTimeMetrics.batteryCharge,
//               'kW',
//               '#9C27B0',
//             )}
//           </View>
//         </View>

//         <View style={[styles.card, styles.cardShadow]}>
//           <Text style={styles.sectionTitle}>{t.predictions}</Text>
//           <View style={styles.predictionsContainer}>
//             {renderPredictionCard(
//               "dollar-sign",
//               t.price,
//               parseFloat(energyData.predictions.price).toFixed(2),
//               "",
//               "#4CAF50"
//             )}
//             {renderPredictionCard(
//               "alert-triangle",
//               t.anomalies,
//               energyData.predictions.anomalies,
//               "",
//               energyData.predictions.anomalies === "normal" ? "#2ECC71" : "#E74C3C", // Conditional border color
//               energyData.predictions.anomalies === "normal" ? "#2ECC71" : "#E74C3C"  // Pass custom border color
//             )}
//             {renderPredictionCard(
//               "zap",
//               t.energy,
//               parseFloat(energyData.predictions.energy).toFixed(2),
//               "kWh",
//               "#2196F3"
//             )}
//             {renderPredictionCard(
//               "clock",
//               t.nextHour,
//               energyData.data.predictions.nextHourProduction,
//               "kWh",
//               "#9C27B0"
//             )}
//           </View>
//         </View>

//         <View style={styles.twoColumnContainer}>
//           <View style={[styles.card, styles.cardShadow, styles.columnCard]}>
//             <Text style={styles.sectionTitle}>{t.batteryStatus}</Text>
//             <Text style={styles.batteryLevel}>{energyData.data.battery.level}%</Text>
//             <Text style={styles.batteryStatusText}>{energyData.data.battery.status}</Text>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailRowText}>
//                 {t.health}: {energyData.data.battery.health}%
//               </Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailRowText}>
//                 {t.timeToFull}: {energyData.data.battery.timeToFull}
//               </Text>
//             </View>
//           </View>
//           <View style={[styles.card, styles.cardShadow, styles.columnCard]}>
//             <Text style={styles.sectionTitle}>{t.gridStatus}</Text>
//             <Text style={styles.gridStatusText}>{energyData.data.grid.status}</Text>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailRowText}>
//                 {t.voltage}: {energyData.data.grid.voltage} V
//               </Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailRowText}>
//                 {t.frequency}: {energyData.data.grid.frequency} Hz
//               </Text>
//             </View>
//           </View>
//         </View>

//         {renderEnergyFlowDiagram()}

//         <View style={[styles.card, styles.cardShadow]}>
//           <Text style={styles.sectionTitle}>{t.historicalData}</Text>
//           <View style={styles.timeframeSelector}>
//             <TouchableOpacity
//               onPress={() => setTimeframe('today')}
//               style={[styles.timeframeButton, timeframe === 'today' && styles.timeframeActive]}
//             >
//               <Text style={[styles.timeframeText, timeframe === 'today' && styles.timeframeActiveText]}>
//                 {t.today}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => setTimeframe('week')}
//               style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeActive]}
//             >
//               <Text style={[styles.timeframeText, timeframe === 'week' && styles.timeframeActiveText]}>
//                 {t.week}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={() => setTimeframe('month')}
//               style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeActive]}
//             >
//               <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeActiveText]}>
//                 {t.month}
//               </Text>
//             </TouchableOpacity>
//           </View>
//           {renderProductionChart()}
//         </View>

//         <View style={[styles.card, styles.cardShadow]}>
//           <Text style={styles.sectionTitle}>{t.weather}</Text>
//           <View style={styles.weatherInfo}>
//             <Feather name="sun" size={40} color="#FFC107" />
//             <View>
//               <Text style={styles.weatherTemp}>{energyData.data.weather.temperature}</Text>
//               <Text style={styles.weatherLocation}>{energyData.data.weather.location}</Text>
//             </View>
//           </View>
//           <Text style={styles.weatherPrediction}>{energyData.data.weather.prediction}</Text>
//         </View>

//         <View style={[styles.card, styles.cardShadow]}>
//           <Text style={styles.sectionTitle}>{t.carbonFootprint}</Text>
//           <View style={styles.metricsGrid}>
//             {renderMetricCard(
//               'activity',
//               t.co2Saved,
//               energyData.data.carbonFootprint.savedToday,
//               'kg',
//               '#4CAF50',
//             )}
//             {renderMetricCard(
//               'bar-chart',
//               t.totalSaved,
//               energyData.data.carbonFootprint.totalSaved,
//               'kg',
//               '#2196F3',
//             )}
//             {renderMetricCard(
//               'git-merge',
//               t.equivalentTrees,
//               energyData.data.carbonFootprint.treesPlantedEquivalent,
//               '',
//               '#9C27B0',
//             )}
//           </View>
//         </View>


//         <TouchableOpacity style={styles.exportButton}>
//           <Feather name="download" size={20} color="#fff" />
//           <Text style={styles.exportButtonText}>{t.export}</Text>
//         </TouchableOpacity>
//       </UniversalScrollContainer>
//     </UniversalSafeArea>
//   );
// }

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import UniversalSafeArea from '../components/UniversalSafeArea';
import UniversalScrollContainer from '../components/UniversalScrollContainer';
import styles from '../styles/EnergyDashboardStyles';
import config from '../assets/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

const translations = {
  en: {
    title: 'Energy Dashboard',
    realTime: 'Real-Time Metrics',
    production: 'Production',
    consumption: 'Consumption',
    gridFeed: 'Grid Feed-In',
    batteryCharge: 'Battery Charge',
    batteryStatus: 'Battery Status',
    level: 'Level',
    health: 'Health',
    timeToFull: 'Time to Full',
    gridStatus: 'Grid Status',
    voltage: 'Voltage',
    frequency: 'Frequency',
    energyFlow: 'Energy Flow',
    solar: 'Solar',
    home: 'Home',
    battery: 'Battery',
    grid: 'Grid',
    weather: 'Weather & Forecast',
    solarIrradiance: 'Solar Irradiance',
    historicalData: 'Historical Data',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    carbonFootprint: 'Carbon Footprint',
    co2Saved: 'CO₂ Saved Today',
    totalSaved: 'Total Saved',
    equivalentTrees: 'Equivalent Trees Planted',
    predictions: 'Predictive Analytics',
    nextHour: 'Next Hour Production',
    peakTime: 'Est. Peak Time',
    price: 'Price Prediction',
    anomalies: 'Anomaly Score',
    energy: 'Energy Prediction',
    export: 'Export Summary',
  },
  bn: {
    title: 'এনার্জি ড্যাশবোর্ড',
    realTime: 'রিয়েল-টাইম মেট্রিক্স',
    production: 'উৎপাদন',
    consumption: 'খরচ',
    gridFeed: 'গ্রিড ফিড-ইন',
    batteryCharge: 'ব্যাটারি চার্জ',
    batteryStatus: 'ব্যাটারির অবস্থা',
    level: 'স্তর',
    health: 'স্বাস্থ্য',
    timeToFull: 'সম্পূর্ণ চার্জ হতে সময়',
    gridStatus: 'গ্রিডের অবস্থা',
    voltage: 'ভোল্টেজ',
    frequency: 'ফ্রিকোয়েন্সি',
    energyFlow: 'এনার্জি ফ্লো',
    solar: 'সৌর',
    home: 'বাসা',
    battery: 'ব্যাটারি',
    grid: 'গ্রিড',
    weather: 'আবহাওয়া ও পূর্বাভাস',
    solarIrradiance: 'সৌর বিকিরণ',
    historicalData: 'ঐতিহাসিক ডেটা',
    today: 'আজ',
    week: 'সপ্তাহ',
    month: 'মাস',
    carbonFootprint: 'কার্বন ফুটপ্রিন্ট',
    co2Saved: 'আজ CO₂ সংরক্ষিত',
    totalSaved: 'মোট সংরক্ষিত',
    equivalentTrees: 'সমতুল্য বৃক্ষরোপণ',
    predictions: 'ভবিষ্যদ্বাণীমূলক বিশ্লেষণ',
    nextHour: 'পরবর্তী ঘন্টার উৎপাদন',
    peakTime: 'আনুমানিক পিক সময়',
    price: 'মূল্য ভবিষ্যদ্বাণী',
    anomalies: 'অস্বাভাবিকতার স্কোর',
    energy: 'এনার্জি ভবিষ্যদ্বাণী',
    export: 'সারাংশ এক্সপোর্ট করুন',
  },
};

export default function EnergyDashboardScreen() {
  const [language, setLanguage] = useState('en');
  const [timeframe, setTimeframe] = useState('today');
  const [energyData, setEnergyData] = useState(null);
  const t = translations[language];

  useEffect(() => {
    fetchEnergyData();
  }, []);

  async function fetchEnergyData() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/energy`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch energy data');
      }

      setEnergyData(data);
    } catch (err) {
      console.error('Error fetching energy data:', err);
      Alert.alert('Error', 'Failed to fetch energy data. Check your network connection.');
    }
  }

  const handleExportPdf = async () => {
    if (!energyData) {
      Alert.alert('Error', 'No data available to export.');
      return;
    }

    const exportDate = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${t.title} - ${exportDate}</title>
        <style>
          body { font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          h1 { text-align: center; color: #2C3E50; font-size: 32px; margin-bottom: 10px; font-weight: 700; }
          .subtitle { text-align: center; color: #7F8C8D; font-size: 16px; margin-bottom: 30px; }
          h2 { color: #34495E; font-size: 24px; border-bottom: 2px solid #ECF0F1; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; font-weight: 600; }
          h3 { color: #555; font-size: 18px; margin-top: 20px; margin-bottom: 10px; font-weight: 600; }
          p { margin-bottom: 8px; }
          .section-block { background-color: #F8F9FC; border-radius: 6px; padding: 15px; margin-bottom: 20px; }
          .data-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px; }
          .data-item { width: 48%; margin-bottom: 10px; }
          .data-label { font-size: 14px; color: #7F8C8D; margin-bottom: 2px; }
          .data-value { font-size: 18px; font-weight: bold; color: #2C3E50; }
          .data-unit { font-size: 14px; font-weight: normal; color: #7F8C8D; }
          .status-indicator { font-size: 16px; font-weight: bold; padding: 5px 10px; border-radius: 5px; display: inline-block; }
          .status-normal { background-color: #D4EDDA; color: #155724; }
          .status-anomaly { background-color: #F8D7DA; color: #721C24; }
          .text-center { text-align: center; }
          .flex-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .flex-item { flex: 1; text-align: center; }
          .color-green { color: #2ECC71; }
          .color-blue { color: #3498DB; }
          .color-orange { color: #E67E22; }
          .color-purple { color: #9B59B6; }
          .color-red { color: #E74C3C; }
          .chart-note { font-style: italic; color: #7F8C8D; text-align: center; padding: 10px; background-color: #ECF0F1; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${t.title}</h1>
          <p class="subtitle">Export Date: ${exportDate}</p>

          <h2>${t.realTime}</h2>
          <div class="section-block">
            <div class="data-grid">
              <div class="data-item">
                <p class="data-label">${t.production}</p>
                <p class="data-value color-green">${energyData.data.realTimeMetrics.production} <span class="data-unit">kW</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.consumption}</p>
                <p class="data-value color-orange">${energyData.data.realTimeMetrics.consumption} <span class="data-unit">kW</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.gridFeed}</p>
                <p class="data-value color-blue">${energyData.data.realTimeMetrics.gridFeedIn} <span class="data-unit">kW</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.batteryCharge}</p>
                <p class="data-value color-purple">${energyData.data.realTimeMetrics.batteryCharge} <span class="data-unit">kW</span></p>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px;">
            <div class="section-block" style="flex: 1;">
              <h2>${t.batteryStatus}</h2>
              <p class="data-value text-center color-green" style="font-size: 40px;">${energyData.data.battery.level}%</p>
              <p class="status-indicator ${energyData.data.battery.status.toLowerCase() === 'charging' ? 'status-normal' : 'status-anomaly'} text-center" style="margin: 0 auto;">${energyData.data.battery.status}</p>
              <p class="flex-row" style="margin-top: 15px;"><span class="data-label">${t.health}:</span> <span class="data-value">${energyData.data.battery.health}%</span></p>
              <p class="flex-row"><span class="data-label">${t.timeToFull}:</span> <span class="data-value">${energyData.data.battery.timeToFull}</span></p>
            </div>
            <div class="section-block" style="flex: 1;">
              <h2>${t.gridStatus}</h2>
              <p class="data-value text-center color-blue" style="font-size: 28px; margin-top: 20px;">${energyData.data.grid.status}</p>
              <p class="flex-row" style="margin-top: 30px;"><span class="data-label">${t.voltage}:</span> <span class="data-value">${energyData.data.grid.voltage} V</span></p>
              <p class="flex-row"><span class="data-label">${t.frequency}:</span> <span class="data-value">${energyData.data.grid.frequency} Hz</span></p>
            </div>
          </div>

          <h2>${t.energyFlow}</h2>
          <div class="section-block text-center">
            <p class="chart-note">Energy flow is best visualized dynamically in the application. Summary below:</p>
            <p style="margin-top: 10px;"><strong class="color-orange">${t.solar}</strong> &rarr; <strong class="color-blue">${t.home}</strong> | <strong class="color-green">${t.battery}</strong> | <strong class="color-red">${t.grid}</strong></p>
          </div>

          <h2>${t.historicalData}</h2>
          <div class="section-block">
            <p class="chart-note">Historical production data for <strong>${t[timeframe]}</strong> is dynamically charted within the application.</p>
            <p style="margin-top: 10px;"><strong>Summary for ${t[timeframe]}:</strong> Max Production: ${Math.max(...(energyData.data.historical[timeframe] || [0]))} kW</p>
          </div>

          <h2>${t.weather}</h2>
          <div class="section-block text-center">
            <p class="data-value color-orange" style="font-size: 40px;">${energyData.data.weather.temperature}</p>
            <p class="data-label" style="font-size: 16px;">${energyData.data.weather.location}</p>
            <p style="font-style: italic; margin-top: 15px; color: #555;">${energyData.data.weather.prediction}</p>
          </div>

          <h2>${t.carbonFootprint}</h2>
          <div class="section-block">
            <div class="data-grid">
              <div class="data-item">
                <p class="data-label">${t.co2Saved}</p>
                <p class="data-value color-green">${energyData.data.carbonFootprint.savedToday} <span class="data-unit">kg</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.totalSaved}</p>
                <p class="data-value color-blue">${energyData.data.carbonFootprint.totalSaved} <span class="data-unit">kg</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.equivalentTrees}</p>
                <p class="data-value color-purple">${energyData.data.carbonFootprint.treesPlantedEquivalent}</p>
              </div>
            </div>
          </div>

          <h2>${t.predictions}</h2>
          <div class="section-block">
            <div class="data-grid">
              <div class="data-item">
                <p class="data-label">${t.price}</p>
                <p class="data-value color-green">${parseFloat(energyData.predictions.price).toFixed(2)}</p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.anomalies}</p>
                <p class="status-indicator ${energyData.predictions.anomalies === "normal" ? "status-normal" : "status-anomaly"}">${energyData.predictions.anomalies}</p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.energy}</p>
                <p class="data-value color-blue">${parseFloat(energyData.predictions.energy).toFixed(2)} <span class="data-unit">kWh</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.nextHour}</p>
                <p class="data-value color-purple">${energyData.data.predictions.nextHourProduction} <span class="data-unit">kWh</span></p>
              </div>
              <div class="data-item">
                <p class="data-label">${t.peakTime}</p>
                <p class="data-value color-orange">${energyData.data.predictions.peakTime}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: t.export });
    } catch (error) {
      console.error('Error generating or sharing PDF:', error);
      Alert.alert('Error', 'Failed to generate or share PDF summary.');
    }
  };

  if (!energyData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading energy data...</Text>
      </View>
    );
  }

  const renderMetricCard = (icon, label, value, unit, color) => (
    <View style={styles.metricCard}>
      <Feather name={icon} size={24} color={color || '#333'} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );

  const renderProductionChart = () => {
    const dataArray = energyData.data.historical[timeframe] || [];
    const maxDataValue = dataArray.length > 0 ? Math.max(...dataArray) : 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {t.production} ({t[timeframe]})
        </Text>
        <View style={styles.chartPlaceholder}>
          {dataArray.length === 0 ? (
            <Text style={styles.chartPlaceholderText}>No data available</Text>
          ) : (
            dataArray.map((value, index) => {
              const barHeight = value > 0 ? (value / maxDataValue) * 150 : 1;
              return (
                <View
                  key={`${timeframe}-${index}`}
                  style={{
                    width: 20,
                    height: barHeight,
                    backgroundColor: '#4CAF50',
                    marginHorizontal: 2,
                    alignSelf: 'flex-end',
                  }}
                />
              );
            })
          )}
        </View>
      </View>
    );
  };

  const renderEnergyFlowDiagram = () => (
    <View style={[styles.card, styles.cardShadow]}>
      <Text style={styles.sectionTitle}>{t.energyFlow}</Text>
      <View style={styles.flowDiagram}>
        <View style={styles.flowNodeContainer}>
          <View style={styles.flowNode}>
            <Feather name="sun" size={24} color="#FFC107" />
            <Text style={styles.nodeText}>{t.solar}</Text>
          </View>
          <View style={styles.flowNode}>
            <Feather name="home" size={24} color="#2196F3" />
            <Text style={styles.nodeText}>{t.home}</Text>
          </View>
          <View style={styles.flowNode}>
            <Feather name="battery-charging" size={24} color="#4CAF50" />
            <Text style={styles.nodeText}>{t.battery}</Text>
          </View>
          <View style={styles.flowNode}>
            <MaterialCommunityIcons name="transmission-tower" size={24} color="#F44336" />
            <Text style={styles.nodeText}>{t.grid}</Text>
          </View>
        </View>
        <Text style={styles.flowArrow}>➔</Text>
      </View>
    </View>
  );

  const renderPredictionCard = (icon, label, value, unit, color, customBorderColor) => (
    <View
      style={[
        styles.predictionCard,
        customBorderColor && { borderLeftColor: customBorderColor, borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.predictionIcon}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.predictionContent}>
        <Text style={styles.predictionLabel}>{label}</Text>
        <Text style={styles.predictionValue}>
          {value} <Text style={styles.predictionUnit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <UniversalSafeArea style={styles.safeArea}>
      <StatusBar style="dark" />
      <UniversalScrollContainer
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'bn' : 'en')}>
            <Text style={styles.langToggle}>{language === 'en' ? 'EN/BN' : 'BN/EN'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>{t.realTime}</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'sunrise',
              t.production,
              energyData.data.realTimeMetrics.production,
              'kW',
              '#4CAF50',
            )}
            {renderMetricCard(
              'zap',
              t.consumption,
              energyData.data.realTimeMetrics.consumption,
              'kW',
              '#FFC107',
            )}
            {renderMetricCard(
              'chevrons-up',
              t.gridFeed,
              energyData.data.realTimeMetrics.gridFeedIn,
              'kW',
              '#2196F3',
            )}
            {renderMetricCard(
              'battery-charging',
              t.batteryCharge,
              energyData.data.realTimeMetrics.batteryCharge,
              'kW',
              '#9C27B0',
            )}
          </View>
        </View>

        <View style={[styles.card, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>{t.predictions}</Text>
          <View style={styles.predictionsContainer}>
            {renderPredictionCard(
              "dollar-sign",
              t.price,
              parseFloat(energyData.predictions.price).toFixed(2),
              "",
              "#4CAF50"
            )}
            {renderPredictionCard(
              "alert-triangle",
              t.anomalies,
              energyData.predictions.anomalies,
              "",
              energyData.predictions.anomalies === "normal" ? "#2ECC71" : "#E74C3C",
              energyData.predictions.anomalies === "normal" ? "#2ECC71" : "#E74C3C"
            )}
            {renderPredictionCard(
              "zap",
              t.energy,
              parseFloat(energyData.predictions.energy).toFixed(2),
              "kWh",
              "#2196F3"
            )}
            {renderPredictionCard(
              "clock",
              t.nextHour,
              energyData.data.predictions.nextHourProduction,
              "kWh",
              "#9C27B0"
            )}

          </View>
        </View>

        <View style={styles.twoColumnContainer}>
          <View style={[styles.card, styles.cardShadow, styles.columnCard]}>
            <Text style={styles.sectionTitle}>{t.batteryStatus}</Text>
            <Text style={styles.batteryLevel}>{energyData.data.battery.level}%</Text>
            <Text style={styles.batteryStatusText}>{energyData.data.battery.status}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailRowText}>
                {t.health}: {energyData.data.battery.health}%
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailRowText}>
                {t.timeToFull}: {energyData.data.battery.timeToFull}
              </Text>
            </View>
          </View>
          <View style={[styles.card, styles.cardShadow, styles.columnCard]}>
            <Text style={styles.sectionTitle}>{t.gridStatus}</Text>
            <Text style={styles.gridStatusText}>{energyData.data.grid.status}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailRowText}>
                {t.voltage}: {energyData.data.grid.voltage} V
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailRowText}>
                {t.frequency}: {energyData.data.grid.frequency} Hz
              </Text>
            </View>
          </View>
        </View>

        {renderEnergyFlowDiagram()}

        <View style={[styles.card, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>{t.historicalData}</Text>
          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              onPress={() => setTimeframe('today')}
              style={[styles.timeframeButton, timeframe === 'today' && styles.timeframeActive]}
            >
              <Text style={[styles.timeframeText, timeframe === 'today' && styles.timeframeActiveText]}>
                {t.today}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeframe('week')}
              style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeActive]}
            >
              <Text style={[styles.timeframeText, timeframe === 'week' && styles.timeframeActiveText]}>
                {t.week}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeframe('month')}
              style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeActive]}
            >
              <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeActiveText]}>
                {t.month}
              </Text>
            </TouchableOpacity>
          </View>
          {renderProductionChart()}
        </View>

        <View style={[styles.card, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>{t.weather}</Text>
          <View style={styles.weatherInfo}>
            <Feather name="sun" size={40} color="#FFC107" />
            <View>
              <Text style={styles.weatherTemp}>{energyData.data.weather.temperature}</Text>
              <Text style={styles.weatherLocation}>{energyData.data.weather.location}</Text>
            </View>
          </View>
          <Text style={styles.weatherPrediction}>{energyData.data.weather.prediction}</Text>
        </View>

        <View style={[styles.card, styles.cardShadow]}>
          <Text style={styles.sectionTitle}>{t.carbonFootprint}</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'activity',
              t.co2Saved,
              energyData.data.carbonFootprint.savedToday,
              'kg',
              '#4CAF50',
            )}
            {renderMetricCard(
              'bar-chart',
              t.totalSaved,
              energyData.data.carbonFootprint.totalSaved,
              'kg',
              '#2196F3',
            )}
            {renderMetricCard(
              'git-merge',
              t.equivalentTrees,
              energyData.data.carbonFootprint.treesPlantedEquivalent,
              '',
              '#9C27B0',
            )}
          </View>
        </View>

        

        <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
          <Feather name="download" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>{t.export}</Text>
        </TouchableOpacity>
      </UniversalScrollContainer>
    </UniversalSafeArea>
  );
}