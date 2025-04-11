import os
from services.broker_interface import BrokerInterface

class BrokerFactory:
    """
    Factory class to create broker interface instances.
    This allows for flexible broker selection and configuration.
    """
    
    # Dictionary of registered broker adapters
    _adapters = {}
    
    @classmethod
    def register_adapter(cls, broker_name, adapter_class):
        """
        Register a broker adapter
        
        Args:
            broker_name (str): Name of the broker
            adapter_class (class): Class implementing BrokerInterface
        """
        if not issubclass(adapter_class, BrokerInterface):
            raise TypeError(f"Adapter must implement BrokerInterface: {adapter_class.__name__}")
        
        cls._adapters[broker_name.lower()] = adapter_class
    
    @classmethod
    def create(cls, broker_name, config=None):
        """
        Create an instance of the appropriate broker adapter
        
        Args:
            broker_name (str): Name of the broker
            config (dict, optional): Configuration for the broker
            
        Returns:
            BrokerInterface: Instance of the broker adapter
            
        Raises:
            ValueError: If broker is not supported
        """
        broker_name = broker_name.lower()
        
        if broker_name not in cls._adapters:
            registered_brokers = ", ".join(cls._adapters.keys())
            raise ValueError(f"Unsupported broker: {broker_name}. Supported brokers: {registered_brokers}")
        
        adapter_class = cls._adapters[broker_name]
        
        # Create adapter instance with provided config or default
        if config is None:
            config = {}
            
        return adapter_class(config)
    
    @classmethod
    def get_supported_brokers(cls):
        """
        Get list of supported brokers
        
        Returns:
            list: Names of supported brokers
        """
        return list(cls._adapters.keys())
    
    @classmethod
    def is_supported(cls, broker_name):
        """
        Check if a broker is supported
        
        Args:
            broker_name (str): Name of the broker
            
        Returns:
            bool: True if supported, False otherwise
        """
        return broker_name.lower() in cls._adapters