import { StyleSheet } from 'react-native';

export const inventoryScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40, // Make room for clear button
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsDescription: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  componentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 32,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  stockContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 70,
    maxWidth: 100,
    alignItems: 'center',
    flexShrink: 0,
  },
  stockText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stockPositive: {
    color: '#28A745',
  },
  stockNegative: {
    color: '#DC3545',
  },
  stockZero: {
    color: '#FFC107',
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    width: 70,
  },
  detailValue: {
    fontSize: 13,
    color: '#1A1A1A',
    flex: 1,
    fontWeight: '500',
  },
  costValue: {
    fontSize: 13,
    color: '#4318FF',
    fontWeight: 'bold',
    flex: 1,
  },
  cardPressedState: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  clickIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#4318FF',
    borderRadius: 10,
    padding: 3,
    zIndex: 1,
  },
  imageContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  componentImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
  },
  descriptionContainer: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
  },
  
  // Create component button styles
  searchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  
  searchInputContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  
  searchingText: {
    fontSize: 13,
    color: '#4318FF',
    fontWeight: '500',
    marginLeft: 6,
  },
  
  createButton: {
    backgroundColor: '#4318FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: '85%',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: 'bold',
  },
  
  modalForm: {
    maxHeight: 350,
  },
  
  inputGroup: {
    marginBottom: 12,
  },
  
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  
  imageButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  
  imageButtonText: {
    fontSize: 15,
    color: '#4318FF',
    fontWeight: '600',
  },
  
  selectedImageContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  
  removeImageButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  
  cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  
  cancelButtonText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
  
  saveButton: {
    backgroundColor: '#4318FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
}); 