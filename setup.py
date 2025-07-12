from setuptools import setup, find_packages

setup(
    name='classroom_management_backend',
    version='0.1.0',
    packages=find_packages(where='src'),
    package_dir={'': 'src'}, # This tells setuptools to look for packages in the 'src' directory
    include_package_data=True,
    install_requires=[
        'Flask',
        'Flask-Cors',
        'fpdf2',
        'gunicorn',
        'pandas',
        'numpy',
    ],
    entry_points={
        'console_scripts': [
            'run_backend=main:app',
        ],
    },
)


