# test_broker_layer.py
import os
import json
from services.unified_broker_service import UnifiedBrokerService

def test_broker_layer():
    print("\n===== Testing Flexible Broker Layer =====\n")
    
    # Initialize the unified broker service
    broker_service = UnifiedBrokerService()
    
    # Get supported brokers
    brokers = broker_service.get_supported_brokers()
    print(f"Supported brokers: {', '.join(brokers)}")
    
    # Test Zerodha adapter
    print("\n----- Testing Zerodha Adapter -----")
    
    # Connect to Zerodha in demo mode
    result = broker_service.connect('zerodha', {})
    print(f"Connection result: {result['success']} - {result.get('message', '')}")
    
    # Get portfolio
    portfolio = broker_service.get_portfolio()
    print(f"Portfolio retrieved: {portfolio['success']}")
    print(f"Holdings count: {len(portfolio.get('holdings', []))}")
    print(f"Positions count: {len(portfolio.get('positions', []))}")
    
    # Disconnect
    result = broker_service.disconnect()
    print(f"Disconnection result: {result['success']} - {result.get('message', '')}")
    
    # Test FYERS adapter
    print("\n----- Testing FYERS Adapter -----")
    
    # Connect to FYERS in demo mode
    result = broker_service.connect('fyers', {})
    print(f"Connection result: {result['success']} - {result.get('message', '')}")
    
    # Get portfolio
    portfolio = broker_service.get_portfolio()
    print(f"Portfolio retrieved: {portfolio['success']}")
    print(f"Holdings count: {len(portfolio.get('holdings', []))}")
    print(f"Positions count: {len(portfolio.get('positions', []))}")
    
    # Disconnect
    result = broker_service.disconnect()
    print(f"Disconnection result: {result['success']} - {result.get('message', '')}")
    
    # Test CDSL Pledge Service
    print("\n----- Testing CDSL Pledge Service -----")
    
    # Get pledged holdings
    result = broker_service.get_pledged_holdings()
    print(f"Pledged holdings retrieved: {result['success']}")
    print(f"Pledged holdings count: {len(result.get('pledges', []))}")
    
    # Create pledge request
    result = broker_service.create_pledge_request('RELIANCE', 5, 'Testing pledge creation')
    print(f"Pledge creation result: {result['success']} - {result.get('message', '')}")
    pledge_id = result.get('pledge_id')
    print(f"Pledge ID: {pledge_id}")
    
    # Get pledge status
    result = broker_service.get_pledge_status(pledge_id)
    print(f"Pledge status: {result['success']} - Status: {result.get('pledge', {}).get('status', 'N/A')}")
    
    # Authorize pledge (with dummy OTP)
    result = broker_service.authorize_pledge(pledge_id, '123456')
    print(f"Pledge authorization: {result['success']} - {result.get('message', '')}")
    
    # Get updated pledge status
    result = broker_service.get_pledge_status(pledge_id)
    print(f"Updated pledge status: {result['success']} - Status: {result.get('pledge', {}).get('status', 'N/A')}")
    
    # Get updated pledged holdings
    result = broker_service.get_pledged_holdings()
    print(f"Updated pledged holdings count: {len(result.get('pledges', []))}")
    
    # Unpledge request
    result = broker_service.unpledge_request(pledge_id, 2, 'Testing unpledge')
    print(f"Unpledge result: {result['success']} - {result.get('message', '')}")
    unpledge_id = result.get('unpledge_id')
    print(f"Unpledge ID: {unpledge_id}")
    
    # Authorize unpledge (with dummy OTP)
    result = broker_service.authorize_pledge(unpledge_id, '123456')
    print(f"Unpledge authorization: {result['success']} - {result.get('message', '')}")
    
    print("\n===== Test Completed =====\n")

if __name__ == "__main__":
    test_broker_layer()