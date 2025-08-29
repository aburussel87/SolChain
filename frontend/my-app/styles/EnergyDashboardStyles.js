import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Lighter, modern background
  },
  container: {
    flex: 1,
    paddingHorizontal: 18, // Slightly increased horizontal padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25, // Increased vertical padding
    borderBottomWidth: 0, // Removed border, relying on shadow or card separation
    backgroundColor: '#F7F9FC', // Match safeArea background
  },
  headerTitle: {
    fontSize: 32, // Larger, more prominent title
    fontWeight: '700', // Bolder font weight
    color: '#2C3E50', // Darker, more professional title color
  },
  langToggle: {
    fontWeight: '600', // Medium bold
    color: '#3498DB', // A clear, active blue
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EBF4F8', // Subtle background for the toggle
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Slightly smaller border radius for a sleeker look
    padding: 20, // Consistent padding
    marginBottom: 18, // Consistent margin between cards
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2, // Softer, less aggressive shadow
    },
    shadowOpacity: 0.08, // Lighter shadow opacity
    shadowRadius: 8, // Wider, softer blur radius
    elevation: 3, // Android shadow
  },
  sectionTitle: {
    fontSize: 20, // Slightly larger section titles
    fontWeight: '700',
    color: '#333',
    marginBottom: 15, // Increased margin for better separation
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#ECF0F1', // Light gray background for metric cards
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '48%', // Allows two cards per row
    marginBottom: 12, // Spacing between metric cards
  },
  metricLabel: {
    fontSize: 13,
    color: '#7F8C8D', // Muted text color
    marginTop: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 24, // Larger metric value
    fontWeight: 'bold',
    color: '#2C3E50', // Darker text for emphasis
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#7F8C8D',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18, // Match card margin
  },
  columnCard: {
    width: '48%',
    // Inherits styles from .card and .cardShadow
  },
  batteryLevel: {
    fontSize: 48, // Much larger for visual impact
    fontWeight: 'bold',
    color: '#2ECC71', // Vibrant green
    textAlign: 'center',
    marginBottom: 5,
  },
  batteryStatusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2ECC71',
    fontWeight: '600',
    marginBottom: 12,
  },
  gridStatusText: {
    fontSize: 22, // Larger grid status text
    fontWeight: '700',
    textAlign: 'center',
    color: '#3498DB', // Active blue for grid status
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 5,
  },
  detailRowText: {
    fontSize: 14,
    color: '#555',
  },
  flowDiagram: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  flowNodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  flowNode: {
    alignItems: 'center',
    width: 60, // Fixed width for nodes
  },
  nodeText: {
    marginTop: 6,
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },
  flowArrow: {
    fontSize: 40, // Larger arrow
    color: '#BDC3C7', // Softer arrow color
    marginVertical: 5, // Adjusted vertical margin
    transform: [{ rotate: '90deg' }], // Rotate for vertical flow
  },
  chartContainer: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: '#FDFEFE', // Slightly different background for charts
    borderRadius: 8,
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute bars evenly
    alignItems: 'flex-end',
    height: 150,
    width: '100%',
    paddingHorizontal: 10,
    borderBottomWidth: 1, // Add a baseline for the chart
    borderBottomColor: '#E0E6EB',
  },
  chartPlaceholderText: {
    color: '#ADB5BD',
    alignSelf: 'center', // Center text if no data
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#E8EDF2', // Light, subtle background
    borderRadius: 25, // More rounded for a modern look
    padding: 3,
    marginBottom: 20,
  },
  timeframeButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20, // Match selector border radius
    minWidth: 90, // Ensure buttons have a minimum width
    alignItems: 'center',
  },
  timeframeActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', // Add shadow to active button
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeframeText: {
    fontWeight: '600',
    color: '#555',
    fontSize: 14,
  },
  timeframeActiveText: {
    color: '#3498DB', // Use active blue
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  weatherTemp: {
    fontSize: 42, // Larger temperature
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#E67E22', // Warm color for temperature
  },
  weatherLocation: {
    marginLeft: 15,
    color: '#7F8C8D',
    fontSize: 14,
  },
  weatherPrediction: {
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
    color: '#555',
    fontSize: 14,
  },
  predictionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  predictionCard: {
    width: '48%', // Two cards per row
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    // borderLeftWidth and borderLeftColor will be set dynamically in the component
    shadowColor: '#000', // Subtle shadow for prediction cards
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  predictionIcon: {
    marginRight: 10,
  },
  predictionContent: {
    flex: 1,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 2,
  },
  predictionUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#7F8C8D',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#27AE60', // A strong, action-oriented green
    padding: 16,
    borderRadius: 12, // Rounded rectangle
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25, // Increased vertical margin
    shadowColor: '#27AE60', // Shadow matching button color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
  },
});

export default styles;
